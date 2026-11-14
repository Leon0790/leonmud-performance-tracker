import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { currentAcademicYear } from '@/utils/learningAreas';

/**
 * Lesson-plan access rules:
 *  - every teacher gets exactly ONE free generation (server-enforced, never resets)
 *  - after that, an entitlement for the exact learning area + term + academic year is required
 */
export function useLessonPlanAccess(user) {
  const { data: account } = useQuery({
    queryKey: ['platform-account', user?.email],
    queryFn: async () => (await base44.functions.invoke('platformAccount', { action: 'sync' })).data,
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  const { data: entitlements = [], isLoading } = useQuery({
    queryKey: ['my-lesson-entitlements', user?.email],
    queryFn: () => base44.entities.LessonPlanEntitlement.filter({ teacher_email: user?.email }, '-created_date', 200),
    enabled: !!user?.email,
  });

  const list = Array.isArray(entitlements) ? entitlements : (entitlements.items || []);
  const freeTrialAvailable = !account?.free_lesson_plan_used;

  const hasEntitlement = (learningArea, term, academicYear = currentAcademicYear()) =>
    list.some(
      (e) =>
        e.status !== 'revoked' &&
        e.learning_area === learningArea &&
        e.term === term &&
        String(e.academic_year) === String(academicYear)
    );

  const canGenerate = (learningArea, term, academicYear = currentAcademicYear()) =>
    freeTrialAvailable || hasEntitlement(learningArea, term, academicYear);

  return { list, isLoading, freeTrialAvailable, hasEntitlement, canGenerate, account, refresh: () => {} };
}