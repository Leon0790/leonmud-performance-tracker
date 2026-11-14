import { base44 } from '@/api/base44Client';
import { currentAcademicYear } from '@/utils/learningAreas';

/**
 * Server-verified access check used immediately before generating a lesson plan.
 * One free generation per teacher, then an entitlement for the exact
 * learning area + term + academic year is required.
 */
export async function ensureLessonAccess(user, learningArea, term) {
  const academicYear = currentAcademicYear();
  const accountRes = await base44.functions.invoke('platformAccount', { action: 'sync' });
  const account = accountRes.data || {};

  const entitlements = await base44.entities.LessonPlanEntitlement.filter({ teacher_email: user?.email }, '-created_date', 200);
  const list = Array.isArray(entitlements) ? entitlements : (entitlements.items || []);
  const has = list.some(
    (e) =>
      e.status !== 'revoked' &&
      e.learning_area === learningArea &&
      e.term === term &&
      String(e.academic_year) === academicYear
  );
  if (has) return { ok: true, school_id: account.school_id, usedTrial: false };

  if (!account.free_lesson_plan_used) {
    const res = await base44.functions.invoke('platformAccount', {
      action: 'consumeFreeLessonPlan',
      learning_area: learningArea,
      term,
      academic_year: academicYear,
    });
    if (res.data?.allowed) return { ok: true, school_id: account.school_id, usedTrial: true };
  }

  return { ok: false, school_id: account.school_id, usedTrial: false };
}