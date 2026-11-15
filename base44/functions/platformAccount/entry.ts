import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const APP_URL = 'https://leon-track-grade.base44.app';
const INVITE_DAYS = 14;

const COLLECTIONS = [
  'TeacherProfile',
  'StudentRegister',
  'Student',
  'Attendance',
  'LessonPlan',
  'Submission',
  'SchoolClass',
  'Announcement',
  'SchoolInvite',
  'Payment',
  'LessonPlanEntitlement',
  'PlatformLicence',
];

const LEARNER_COLLECTIONS = ['StudentRegister', 'Student'];

const LABELS = {
  TeacherProfile: 'teachers',
  StudentRegister: 'learners in the register',
  Student: 'learner marks records',
  Attendance: 'attendance records',
  LessonPlan: 'lesson plans',
  Submission: 'assessment submissions',
  SchoolClass: 'classes',
  Announcement: 'announcements',
  SchoolInvite: 'invitations',
  Payment: 'payment transactions',
  LessonPlanEntitlement: 'lesson plan purchases',
  PlatformLicence: 'subscriptions',
};

function isoNow() {
  return new Date().toISOString();
}

function futureIso(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function normalise(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(school|schools|primary|secondary|junior|academy|mixed|day|high|the|and|of|ltd|limited)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a, b) {
  const x = normalise(a);
  const y = normalise(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const m = x.length;
  const n = y.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      dp[i][j] = x[i - 1] === y[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n] / Math.max(m, n);
}

async function all(sr, entity, query, limit = 500) {
  const res = await sr.entities[entity].filter(query, undefined, limit);
  return res.items || res || [];
}

async function schoolCounts(sr, schoolId) {
  const counts = {};
  for (const name of COLLECTIONS) {
    counts[name] = await sr.entities[name].count({ school_id: schoolId }).catch(() => 0);
  }
  return counts;
}

function totalRecords(counts) {
  return Object.values(counts).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

async function audit(sr, actor, action, payload) {
  await sr.entities.AuditLog.create({
    actor_email: actor?.email || '',
    actor_name: actor?.full_name || '',
    action,
    school_id: payload?.school_id || '',
    school_name: payload?.school_name || '',
    target: payload?.target || '',
    details: payload?.details || '',
    reason: payload?.reason || '',
  }).catch(() => null);
}

async function findDuplicates(sr, { name, code, excludeId }) {
  const schools = await all(sr, 'School', {}, 500);
  const codeKey = String(code || '').trim().toLowerCase();
  const nameKey = normalise(name);
  return schools
    .filter((s) => s.id !== excludeId)
    .map((s) => {
      const sameCode = !!codeKey && String(s.code || '').trim().toLowerCase() === codeKey;
      const sameName = !!nameKey && normalise(s.name) === nameKey;
      const ratio = similarity(name, s.name);
      return {
        school: s,
        sameCode,
        sameName,
        ratio,
        blocked: sameCode || sameName,
        similar: !sameCode && !sameName && ratio >= 0.72,
      };
    })
    .filter((entry) => entry.blocked || entry.similar)
    .sort((a, b) => b.ratio - a.ratio)
    .map((entry) => ({
      id: entry.school.id,
      name: entry.school.name,
      code: entry.school.code,
      county: entry.school.county || '',
      sub_county: entry.school.sub_county || '',
      headteacher_name: entry.school.headteacher_name || '',
      headteacher_email: entry.school.headteacher_email || '',
      subscription_status: entry.school.subscription_status || 'pending',
      reason: entry.sameCode ? 'Same school code' : entry.sameName ? 'Same school name' : 'Similar school name',
      blocked: entry.blocked,
    }));
}

async function sendInviteEmail(sr, { to, name, schoolName, role }) {
  const label = role === 'headteacher' ? 'headteacher' : 'teacher';
  const body = [
    `Hello ${name || ''},`.trim(),
    '',
    `You have been invited as ${label === 'headteacher' ? 'the Headteacher Admin' : 'a teacher'} of ${schoolName} on the LeonMud Performance Tracker.`,
    '',
    'Accept the invitation by signing in with this email address:',
    `${APP_URL}`,
    '',
    'If you already have a LeonMud account, simply sign in with this email address and the school will be connected to it automatically. No new account is created.',
    '',
    'LeonMud Performance Tracker',
  ].join('\n');

  try {
    await sr.integrations.Core.SendEmail({
      to,
      subject: `Invitation to ${schoolName} — LeonMud Performance Tracker`,
      body,
      category: 'transactional',
    });
    return true;
  } catch (e) {
    return false;
  }
}

async function createInvite(sr, actor, payload) {
  const email = String(payload.email || '').trim().toLowerCase();
  const existing = await all(sr, 'SchoolInvite', { email, status: 'pending' }, 10);
  const duplicate = existing.find((invite) => invite.school_id === payload.school_id);
  if (duplicate) {
    await sr.entities.SchoolInvite.update(duplicate.id, {
      teacher_name: payload.teacher_name || duplicate.teacher_name || '',
      grades: payload.grades || duplicate.grades || [],
      classes: payload.classes || duplicate.classes || [],
      learning_areas: payload.learning_areas || duplicate.learning_areas || [],
      expires_at: futureIso(INVITE_DAYS),
      invited_by_email: actor?.email || '',
    });
    return { id: duplicate.id, reused: true };
  }

  const invite = await sr.entities.SchoolInvite.create({
    school_id: payload.school_id,
    school_name: payload.school_name || '',
    email,
    teacher_name: payload.teacher_name || '',
    user_type: payload.user_type === 'headteacher' ? 'headteacher' : 'teacher',
    grades: payload.grades || [],
    classes: payload.classes || [],
    learning_areas: payload.learning_areas || [],
    status: 'pending',
    invited_by_email: actor?.email || '',
    expires_at: futureIso(INVITE_DAYS),
    email_sent: false,
  });
  return { id: invite.id, reused: false, invite };
}

async function inviteAccount(sr, email) {
  try {
    if (sr.users?.inviteUser) {
      await sr.users.inviteUser(email, 'user');
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}

async function ensureProfile(sr, profile) {
  const existing = await all(sr, 'TeacherProfile', { teacher_email: profile.email }, 5);
  const record = existing[0];
  const payload = {
    school_id: profile.school_id,
    school_name: profile.school_name || '',
    teacher_email: profile.email,
    teacher_name: profile.name || profile.email,
    grades: profile.grades || [],
    classes: profile.classes || [],
    learning_areas: profile.learning_areas || [],
    status: profile.status || 'active',
    joined_date: new Date().toISOString().slice(0, 10),
  };
  if (record) return sr.entities.TeacherProfile.update(record.id, payload);
  return sr.entities.TeacherProfile.create(payload);
}

async function backfillRecords(sr, email, schoolId) {
  for (const name of ['Student', 'StudentRegister', 'Attendance', 'LessonPlan']) {
    const rows = (await all(sr, name, { teacher_email: email }, 200)).filter((r) => !r.school_id);
    if (!rows.length) continue;
    await sr.entities[name].bulkUpdate(rows.map((r) => ({ id: r.id, school_id: schoolId })));
  }
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const authUser = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!authUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'sync';
    const sr = base44.asServiceRole;
    const isSuperAdmin = authUser.role === 'admin';

    const records = await sr.entities.User.filter({ email: authUser.email });
    const record = (records.items || records)[0];
    if (!record) return Response.json({ error: 'User record not found' }, { status: 404 });

    const callerType = record.user_type || (isSuperAdmin ? 'super_admin' : 'teacher');

    // ---------------------------------------------------------------- account sync
    if (action === 'sync') {
      const updates = {};
      if (!record.user_type) updates.user_type = isSuperAdmin ? 'super_admin' : 'teacher';
      if (!record.trial_started_at) updates.trial_started_at = isoNow();

      const userType = updates.user_type || record.user_type;

      if (!record.school_id && userType !== 'super_admin') {
        const invites = await all(sr, 'SchoolInvite', { email: authUser.email, status: 'pending' }, 10);
        const invite = invites.sort((a, b) => String(b.created_date).localeCompare(String(a.created_date)))[0];
        if (invite) {
          if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
            await sr.entities.SchoolInvite.update(invite.id, { status: 'expired' });
          } else {
            updates.school_id = invite.school_id;
            updates.school_name = invite.school_name || '';
            updates.user_type = invite.user_type || 'teacher';
            await sr.entities.SchoolInvite.update(invite.id, { status: 'claimed', claimed_at: isoNow() });
            await ensureProfile(sr, {
              email: authUser.email,
              name: invite.teacher_name || authUser.full_name,
              school_id: invite.school_id,
              school_name: invite.school_name,
              grades: invite.grades,
              classes: invite.classes,
              learning_areas: invite.learning_areas,
            });
            await backfillRecords(sr, authUser.email, invite.school_id);
            await audit(sr, { email: authUser.email, full_name: authUser.full_name }, 'invitation_accepted', {
              school_id: invite.school_id,
              school_name: invite.school_name,
              target: authUser.email,
              details: invite.user_type === 'headteacher' ? 'Headteacher joined' : 'Teacher joined',
            });
          }
        }
      }

      if (Object.keys(updates).length) await sr.entities.User.update(record.id, updates);
      const merged = { ...record, ...updates };

      let school = null;
      if (merged.school_id) {
        const byField = await all(sr, 'School', { school_id: merged.school_id }, 5);
        school = byField[0] || null;
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

    // ------------------------------------------------------- free lesson plan trial
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

    // ------------------------------------------------------------- school registration
    if (action === 'registerSchoolAndInvite') {
      if (!isSuperAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const name = String(body.name || '').trim();
      const code = String(body.code || '').trim();
      if (!name || !code) return Response.json({ error: 'School name and code are required' }, { status: 400 });

      const duplicates = await findDuplicates(sr, { name, code });
      const blocking = duplicates.filter((d) => d.blocked);
      if (blocking.length) {
        return Response.json({ duplicates, blocked: true }, { status: 200 });
      }
      if (duplicates.length && !body.force) {
        return Response.json({ duplicates, blocked: false, needs_confirmation: true }, { status: 200 });
      }

      const created = await sr.entities.School.create({
        name,
        code,
        county: String(body.county || '').trim(),
        sub_county: String(body.sub_county || '').trim(),
        email: String(body.email || '').trim(),
        contact_number: String(body.contact_number || '').trim(),
        headteacher_name: String(body.headteacher_name || '').trim(),
        headteacher_email: String(body.headteacher_email || '').trim().toLowerCase(),
        date_registered: new Date().toISOString().slice(0, 10),
        subscription_status: 'pending',
        school_id: '',
      });
      await sr.entities.School.update(created.id, { school_id: created.id });

      let inviteResult = null;
      if (body.headteacher_email) {
        const email = String(body.headteacher_email).trim().toLowerCase();
        const invited = await inviteAccount(sr, email);
        const created_invite = await createInvite(sr, { email: authUser.email, full_name: authUser.full_name }, {
          school_id: created.id,
          school_name: name,
          email,
          teacher_name: String(body.headteacher_name || '').trim(),
          user_type: 'headteacher',
        });
        const sent = await sendInviteEmail(sr, {
          to: email,
          name: String(body.headteacher_name || '').trim(),
          schoolName: name,
          role: 'headteacher',
        });
        await sr.entities.SchoolInvite.update(created_invite.id, { email_sent: sent || invited });
        inviteResult = { email, email_sent: sent || invited };
      }

      await audit(sr, authUser, 'school_registered', {
        school_id: created.id,
        school_name: name,
        target: code,
        details: inviteResult ? `Headteacher invited: ${inviteResult.email}` : 'No headteacher invited yet',
      });

      return Response.json({
        school: { ...created, school_id: created.id },
        invite: inviteResult,
        duplicates,
      });
    }

    // ------------------------------------------------------------ duplicate checking
    if (action === 'checkDuplicateSchool') {
      if (!isSuperAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const duplicates = await findDuplicates(sr, {
        name: body.name,
        code: body.code,
        excludeId: body.school_id || undefined,
      });
      return Response.json({ duplicates });
    }

    // --------------------------------------------------------------- account lookups
    if (action === 'lookupAccount') {
      if (!isSuperAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const email = String(body.email || '').trim().toLowerCase();
      if (!email) return Response.json({ error: 'Email is required' }, { status: 400 });

      const users = await all(sr, 'User', { email }, 2);
      const found = users[0];
      if (!found) return Response.json({ found: false });

      const learnerRecords = await sr.entities.Student.count({ teacher_email: email }).catch(() => 0);
      const marksRecords = await sr.entities.StudentRegister.count({ teacher_email: email }).catch(() => 0);
      let currentSchool = null;
      if (found.school_id) {
        currentSchool = (await all(sr, 'School', { school_id: found.school_id }, 2))[0] || null;
      }

      return Response.json({
        found: true,
        account: {
          email: found.email,
          full_name: found.full_name || found.email,
          role: found.role || 'user',
          user_type: found.user_type || 'teacher',
          school_id: found.school_id || '',
          school_name: found.school_name || currentSchool?.name || '',
          learners: learnerRecords + marksRecords,
        },
      });
    }

    if (action === 'linkAccount') {
      if (!isSuperAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      if (!body.confirm) return Response.json({ error: 'Linking needs confirmation' }, { status: 400 });
      const email = String(body.email || '').trim().toLowerCase();
      const schoolId = body.school_id;
      if (!email || !schoolId) return Response.json({ error: 'email and school_id are required' }, { status: 400 });

      const school = await sr.entities.School.get(schoolId).catch(() => null);
      if (!school) return Response.json({ error: 'School not found' }, { status: 404 });

      const target = (await all(sr, 'User', { email }, 2))[0];
      if (!target) return Response.json({ error: 'No LeonMud account uses that email yet. Invite them instead.' }, { status: 404 });

      const previousSchool = target.school_id || '';
      await sr.entities.User.update(target.id, {
        school_id: schoolId,
        school_name: school.name,
        user_type: body.user_type === 'headteacher' ? 'headteacher' : 'teacher',
      });
      await ensureProfile(sr, {
        email,
        name: target.full_name,
        school_id: schoolId,
        school_name: school.name,
        status: 'active',
      });
      if (body.transfer_records) await backfillRecords(sr, email, schoolId);

      await audit(sr, authUser, 'user_linked', {
        school_id: schoolId,
        school_name: school.name,
        target: email,
        details: `Moved from ${previousSchool || 'no school'} to ${school.name}. Records transferred: ${body.transfer_records ? 'yes' : 'no'}`,
      });

      return Response.json({ ok: true, school_name: school.name, previous_school: previousSchool });
    }

    // ------------------------------------------------------------------ invitations
    if (action === 'inviteMember') {
      if (!isSuperAdmin && callerType !== 'headteacher') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      const email = String(body.email || '').trim().toLowerCase();
      if (!email) return Response.json({ error: 'email is required' }, { status: 400 });
      const schoolId = body.school_id || record.school_id;
      if (!schoolId) return Response.json({ error: 'No school linked to this account' }, { status: 400 });
      if (!isSuperAdmin && schoolId !== record.school_id) {
        return Response.json({ error: 'You can only invite teachers to your own school' }, { status: 403 });
      }

      const school = await sr.entities.School.get(schoolId).catch(() => null);
      const userType = body.user_type === 'headteacher' ? 'headteacher' : 'teacher';

      const invited = await inviteAccount(sr, email);
      const createdInvite = await createInvite(sr, authUser, {
        school_id: schoolId,
        school_name: school?.name || record.school_name || '',
        email,
        teacher_name: String(body.teacher_name || '').trim(),
        user_type: userType,
        grades: body.grades || [],
        classes: body.classes || [],
        learning_areas: body.learning_areas || [],
      });

      if (userType === 'teacher') {
        await ensureProfile(sr, {
          email,
          name: String(body.teacher_name || '').trim() || email,
          school_id: schoolId,
          school_name: school?.name || record.school_name || '',
          grades: body.grades || [],
          classes: body.classes || [],
          learning_areas: body.learning_areas || [],
          status: 'invited',
        });
      }

      const sent = await sendInviteEmail(sr, {
        to: email,
        name: String(body.teacher_name || '').trim(),
        schoolName: school?.name || record.school_name || 'your school',
        role: userType,
      });
      await sr.entities.SchoolInvite.update(createdInvite.id, { email_sent: sent || invited });

      await audit(sr, authUser, 'teacher_invited', {
        school_id: schoolId,
        school_name: school?.name || '',
        target: email,
        details: `${userType} invitation ${createdInvite.reused ? 'refreshed' : 'sent'}`,
      });

      return Response.json({
        invite_id: createdInvite.id,
        invited,
        email_sent: sent || invited,
        note: sent || invited ? 'Invitation email sent.' : 'Invitation saved. They join the school the first time they sign in with this email.',
      });
    }

    if (action === 'resendInvite' || action === 'cancelInvite') {
      const invite = await sr.entities.SchoolInvite.get(body.invite_id).catch(() => null);
      if (!invite) return Response.json({ error: 'Invitation not found' }, { status: 404 });
      if (!isSuperAdmin && invite.school_id !== record.school_id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (action === 'cancelInvite') {
        await sr.entities.SchoolInvite.update(invite.id, { status: 'cancelled' });
        await audit(sr, authUser, 'invitation_cancelled', {
          school_id: invite.school_id,
          school_name: invite.school_name,
          target: invite.email,
        });
        return Response.json({ ok: true });
      }

      await inviteAccount(sr, invite.email);
      const sent = await sendInviteEmail(sr, {
        to: invite.email,
        name: invite.teacher_name,
        schoolName: invite.school_name,
        role: invite.user_type,
      });
      await sr.entities.SchoolInvite.update(invite.id, {
        status: 'pending',
        expires_at: futureIso(INVITE_DAYS),
        email_sent: sent,
      });
      await audit(sr, authUser, 'invitation_resent', {
        school_id: invite.school_id,
        school_name: invite.school_name,
        target: invite.email,
      });
      return Response.json({ ok: true, email_sent: sent });
    }

    // --------------------------------------------------------------- legacy assignment
    if (action === 'assignSchool') {
      if (!isSuperAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const { email, school_id, user_type } = body;
      if (!email || !school_id) return Response.json({ error: 'email and school_id are required' }, { status: 400 });

      const school = await sr.entities.School.get(school_id).catch(() => null);
      if (!school) return Response.json({ error: 'School not found' }, { status: 404 });

      const target = (await all(sr, 'User', { email }, 2))[0];
      if (!target) return Response.json({ error: 'User not found' }, { status: 404 });

      await sr.entities.User.update(target.id, {
        school_id,
        school_name: school.name,
        user_type: user_type || 'teacher',
      });
      await ensureProfile(sr, { email, name: target.full_name, school_id, school_name: school.name });
      await backfillRecords(sr, email, school_id);
      await audit(sr, authUser, 'school_ownership_changed', {
        school_id,
        school_name: school.name,
        target: email,
        details: `Role set to ${user_type || 'teacher'}`,
      });
      return Response.json({ ok: true, school: school.name });
    }

    // ------------------------------------------------------------------- merge schools
    if (action === 'schoolStats') {
      if (!isSuperAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const schoolId = body.school_id;
      const counts = await schoolCounts(sr, schoolId);
      const learners = await sr.entities.StudentRegister.count({ school_id: schoolId }).catch(() => 0);
      return Response.json({ counts, total: totalRecords(counts), learners, labels: LABELS });
    }

    if (action === 'mergeSchools') {
      if (!isSuperAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const mainId = body.main_id;
      const duplicateId = body.duplicate_id;
      if (!mainId || !duplicateId) return Response.json({ error: 'main_id and duplicate_id are required' }, { status: 400 });
      if (mainId === duplicateId) return Response.json({ error: 'Choose two different schools' }, { status: 400 });
      if (body.confirm !== true) return Response.json({ error: 'Confirmation required' }, { status: 400 });

      const main = await sr.entities.School.get(mainId).catch(() => null);
      const duplicate = await sr.entities.School.get(duplicateId).catch(() => null);
      if (!main || !duplicate) return Response.json({ error: 'School not found' }, { status: 404 });
      if (duplicate.merged_into) return Response.json({ error: 'That school was already merged' }, { status: 400 });

      const mainSchoolId = main.school_id || main.id;
      const duplicateSchoolId = duplicate.school_id || duplicate.id;

      const learnerKeys = new Set();
      for (const name of LEARNER_COLLECTIONS) {
        const rows = await all(sr, name, { school_id: mainSchoolId }, 500);
        rows.forEach((row) => {
          const key = String(row.admission_number || '').trim().toLowerCase();
          if (key) learnerKeys.add(`${name}|${key}`);
        });
      }

      const moved = {};
      const leftBehind = [];
      for (const name of COLLECTIONS) {
        const rows = await all(sr, name, { school_id: duplicateSchoolId }, 500);
        let transferable = rows;
        if (LEARNER_COLLECTIONS.includes(name)) {
          transferable = [];
          for (const row of rows) {
            const key = String(row.admission_number || '').trim().toLowerCase();
            if (key && learnerKeys.has(`${name}|${key}`)) {
              leftBehind.push({ type: name, label: row.name || row.first_name || row.admission_number || row.id });
              continue;
            }
            if (key) learnerKeys.add(`${name}|${key}`);
            transferable.push(row);
          }
        }
        for (let i = 0; i < transferable.length; i += 100) {
          const chunk = transferable.slice(i, i + 100);
          await sr.entities[name].bulkUpdate(chunk.map((row) => ({
            id: row.id,
            school_id: mainSchoolId,
            school_name: main.name,
          })));
        }
        moved[name] = transferable.length;
        if (rows.length === 500) moved[`${name}_truncated`] = true;
      }

      const members = await all(sr, 'User', { school_id: duplicateSchoolId }, 500);
      for (const member of members) {
        await sr.entities.User.update(member.id, { school_id: mainSchoolId, school_name: main.name });
      }
      moved.accounts = members.length;

      await sr.entities.School.update(duplicateId, {
        subscription_status: 'archived',
        merged_into: mainSchoolId,
        archived_at: isoNow(),
        archive_reason: `Merged into ${main.name}`,
      });

      await audit(sr, authUser, 'school_merged', {
        school_id: mainSchoolId,
        school_name: main.name,
        target: duplicate.name,
        details: `Merged ${duplicate.name} (${duplicate.code}) into ${main.name} (${main.code}). Moved: ${Object.entries(moved)
          .filter(([key]) => !key.endsWith('_truncated'))
          .map(([key, value]) => `${LABELS[key] || key} ${value}`)
          .join(', ')}${leftBehind.length ? `. Left in archive: ${leftBehind.length} duplicate learner records` : ''}`,
      });

      return Response.json({ ok: true, moved, leftBehind, labels: LABELS, main: { id: main.id, name: main.name } });
    }

    // ------------------------------------------------------ archive / delete schools
    if (action === 'archiveSchool' || action === 'restoreSchool' || action === 'deleteSchool') {
      if (!isSuperAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const schoolId = body.school_id;
      const school = await sr.entities.School.get(schoolId).catch(() => null);
      if (!school) return Response.json({ error: 'School not found' }, { status: 404 });

      const counts = await schoolCounts(sr, school.school_id || school.id);
      const total = totalRecords(counts);

      if (action === 'archiveSchool') {
        if (body.confirm !== true) return Response.json({ error: 'Confirmation required' }, { status: 400 });
        await sr.entities.School.update(schoolId, {
          subscription_status: 'archived',
          status_before_archive: school.subscription_status || 'pending',
          archived_at: isoNow(),
          archive_reason: String(body.reason || 'Archived by administrator'),
        });
        await audit(sr, authUser, 'school_archived', {
          school_id: schoolId,
          school_name: school.name,
          target: school.code,
          reason: String(body.reason || ''),
          details: `${total} related records preserved`,
        });
        return Response.json({ ok: true, counts });
      }

      if (action === 'restoreSchool') {
        await sr.entities.School.update(schoolId, {
          subscription_status: school.status_before_archive || 'pending',
          merged_into: '',
          archived_at: '',
        });
        await audit(sr, authUser, 'school_restored', {
          school_id: schoolId,
          school_name: school.name,
          target: school.code,
        });
        return Response.json({ ok: true, counts });
      }

      // permanent deletion
      const targets = await all(sr, 'School', { merged_into: schoolId }, 5);
      if (targets.length) {
        return Response.json({ error: 'This school holds merged records. Restore and merge in the other direction instead.' }, { status: 400 });
      }
      if (total > 0) {
        return Response.json({
          blocked: true,
          counts,
          total,
          message: 'This school still holds records. Merge or archive them before deleting.',
        }, { status: 200 });
      }
      if (String(body.confirm_code || '').trim().toLowerCase() !== String(school.code || '').trim().toLowerCase()) {
        return Response.json({ error: 'Type the school code exactly to confirm deletion' }, { status: 400 });
      }

      await sr.entities.AuditLog.create({
        actor_email: authUser.email,
        actor_name: authUser.full_name || '',
        action: 'school_deleted',
        school_id: schoolId,
        school_name: school.name,
        target: school.code,
        reason: String(body.reason || ''),
        details: 'Empty duplicate school record deleted permanently',
      }).catch(() => null);
      await sr.entities.School.delete(schoolId);
      return Response.json({ ok: true, deleted: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}