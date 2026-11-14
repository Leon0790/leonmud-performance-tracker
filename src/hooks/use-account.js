import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Current user plus their platform account: staff role, school and trial.
 * Calling sync also claims any pending school invite and starts the trial once.
 */
export function useAccount() {
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: account, isLoading: loadingAccount, refetch } = useQuery({
    queryKey: ['platform-account', user?.email],
    queryFn: async () => {
      const res = await base44.functions.invoke('platformAccount', { action: 'sync' });
      return res.data;
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  const userType = account?.user_type || (user?.role === 'admin' ? 'super_admin' : 'teacher');

  return {
    user,
    account,
    userType,
    schoolId: account?.school_id || '',
    schoolName: account?.school_name || '',
    school: account?.school || null,
    isSuperAdmin: userType === 'super_admin',
    isHeadteacher: userType === 'headteacher',
    isTeacher: userType === 'teacher',
    hasSchool: !!account?.school_id,
    trialStartedAt: account?.trial_started_at || null,
    freeLessonPlanUsed: !!account?.free_lesson_plan_used,
    loading: loadingUser || loadingAccount,
    refresh: refetch,
  };
}

/** Fields every school-scoped record needs so the whole school can see it. */
export function schoolFields(schoolId, schoolName) {
  const fields = {};
  if (schoolId) fields.school_id = schoolId;
  if (schoolName) fields.school_name = schoolName;
  return fields;
}