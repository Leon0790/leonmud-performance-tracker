import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const BACKFILL_FIELDS = {};

function schoolUpdates(email, schoolId, schoolName) {
  return { school_id: schoolId, school_name: schoolName || '' };
}

async function backfillRecords(sr, email, schoolId) {
  const entities = ['Student', 'StudentRegister', 'Attendance', 'LessonPlan'];
  for (const name of entities) {
    const found = await sr.entities[name].filter({ teacher_email: email }, undefined, 200);
    const items = (found.items || found).filter((r) => !r.school_id);
    if (!items.length) continue;
    await sr.entities[name].bulkUpdate(items.map((r) => ({ id: r.id, school_id: schoolId })));
  }
}

async function ensureProfile(sr, profile) {
  const existing = await sr.entities.TeacherProfile.filter({ teacher_email: profile.email }, undefined, 5);
  const record = (existing.items || existing)[0];
  const payload = {
    school_id: profile.school_id,
    school_name: profile.school_name || '',
    teacher_email: profile.email,
    teacher_name: profile.name || profile.email,
    grades: profile.grades || [],
    classes: profile.classes || [],
    learning_areas: profile.learning_areas || [],
    status: 'active',
    joined_date: new Date().toISOString().slice(0, 10),
  };
  if (record) return sr.entities.TeacherProfile.update(record.id, payload);
  return sr.entities.TeacherProfile.create(payload);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const authUser = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!authUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'sync';
    const sr = base44.asServiceRole;

    const records = await sr.entities.User.filter({ email: authUser.email });
    const record = (records.items || records)[0];
    if (!record) return Response.json({ error: 'User record not found' }, { status: 404 });

    if (action === 'sync') {
      const updates = {};
      if (!record.user_type) updates.user_type = authUser.role === 'admin' ? 'super_admin' : 'teacher';
      if (!record.trial_started_at) updates.trial_started_at = new Date().toISOString();

      const userType = updates.user_type || record.user_type;

      if (!record.school_id && userType !== 'super_admin') {
        const invites = await sr.entities.SchoolInvite.filter({ email: authUser.email, status: 'pending' }, '-created_date', 5);
        const invite = (invites.items || invites)[0];
        if (invite) {
          updates.school_id = invite.school_id;
          updates.school_name = invite.school_name || '';
          updates.user_type = invite.user_type || 'teacher';
          await sr.entities.SchoolInvite.update(invite.id, { status: 'claimed', claimed_at: new Date().toISOString() });
          await ensureProfile(sr, {
            email: authUser.email,
            name: authUser.full_name,
            school_id: invite.school_id,
            school_name: invite.school_name,
            grades: invite.grades,
            classes: invite.classes,
            learning_areas: invite.learning_areas,
          });
          await backfillRecords(sr, authUser.email, invite.school_id);
        }
      }

      if (Object.keys(updates).length) await sr.entities.User.update(record.id, updates);
      const merged = { ...record, ...updates };

      let school = null;
      if (merged.school_id) {
        const byField = await sr.entities.School.filter({ school_id: merged.school_id }, undefined, 5);
        school = (byField.items || byField)[0] || null;
        if (!school) school = await sr.entities.School.get(merged.school_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      }

      return Response.json({
        user_type: merged.user_type,
        school_id: merged.school_id || '',
        school_name: merged.school_name || school?.name || '',
        trial_started_at: merged.trial_started_at,
        free_lesson_plan_used: !!merged.free_lesson_plan_used,
        school,
      });
    }

    if (action === 'consumeFreeLessonPlan') {
      if (record.free_lesson_plan_used) return Response.json({ allowed: false, reason: 'free_trial_used' });
      if (!body.learning_area || !body.term || !body.academic_year) {
        return Response.json({ error: 'learning_area, term and academic_year are required' }, { status: 400 });
      }
      await sr.entities.User.update(record.id, { free_lesson_plan_used: true });
      await sr.entities.LessonPlanEntitlement.create({
        school_id: record.school_id || '',
        teacher_email: authUser.email,
        teacher_name: authUser.full_name || '',
        learning_area: body.learning_area,
        term: body.term,
        academic_year: String(body.academic_year),
        amount: 0,
        source: 'trial',
        purchased_by_email: authUser.email,
        status: 'active',
      });
      return Response.json({ allowed: true });
    }

    if (action === 'assignSchool') {
      if (authUser.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const { email, school_id, user_type } = body;
      if (!email || !school_id) return Response.json({ error: 'email and school_id are required' }, { status: 400 });

      const school = await sr.entities.School.get(school_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!school) return Response.json({ error: 'School not found' }, { status: 404 });

      const targets = await sr.entities.User.filter({ email });
      const target = (targets.items || targets)[0];
      if (!target) return Response.json({ error: 'User not found' }, { status: 404 });

      await sr.entities.User.update(target.id, {
        school_id,
        school_name: school.name,
        user_type: user_type || 'teacher',
      });
      await ensureProfile(sr, { email, name: target.full_name, school_id, school_name: school.name });
      await backfillRecords(sr, email, school_id);
      return Response.json({ ok: true, school: school.name });
    }

    if (action === 'inviteMember') {
      const callerType = record.user_type || (authUser.role === 'admin' ? 'super_admin' : 'teacher');
      if (authUser.role !== 'admin' && callerType !== 'headteacher') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      const email = String(body.email || '').trim().toLowerCase();
      if (!email) return Response.json({ error: 'email is required' }, { status: 400 });
      const schoolId = body.school_id || record.school_id;
      if (!schoolId) return Response.json({ error: 'No school linked to this account' }, { status: 400 });
      if (callerType === 'headteacher' && schoolId !== record.school_id) {
        return Response.json({ error: 'You can only invite teachers to your own school' }, { status: 403 });
      }

      let invited = false;
      let note = '';
      try {
        if (sr.users?.inviteUser) {
          await sr.users.inviteUser(email, 'user');
          invited = true;
        }
      } catch (e) {
        note = e.message || 'Invitation email could not be sent';
      }

      const existing = await sr.entities.SchoolInvite.filter({ email, status: 'pending' }, undefined, 5);
      if (!(existing.items || existing).length) {
        const school = await sr.entities.School.get(schoolId).catch(() => null);
        await sr.entities.SchoolInvite.create({
          school_id: schoolId,
          school_name: school?.name || record.school_name || '',
          email,
          user_type: body.user_type === 'headteacher' ? 'headteacher' : 'teacher',
          status: 'pending',
          invited_by_email: authUser.email,
        });
      }
      return Response.json({ invited, note });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}