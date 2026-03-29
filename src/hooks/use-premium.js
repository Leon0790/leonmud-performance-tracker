import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const TRIAL_HOURS = 24;

function isWithinTrial(user) {
  if (!user?.created_date) return false;
  const created = new Date(user.created_date);
  const hoursSince = (new Date() - created) / (1000 * 60 * 60);
  return hoursSince < TRIAL_HOURS;
}

/**
 * Returns { isPremium, isLoading }
 * isPremium = true if: admin, approved payment, or within 24h trial
 */
export function usePremium() {
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: payments = [], isLoading: isLoadingPayment } = useQuery({
    queryKey: ['payment', user?.email],
    queryFn: () => base44.entities.Payment.filter({ teacher_email: user?.email }),
    enabled: !!user?.email,
  });

  const isLoading = isLoadingUser || isLoadingPayment;

  if (isLoading) return { isPremium: false, isLoading: true };

  if (!user) return { isPremium: false, isLoading: false };
  if (user.role === 'admin') return { isPremium: true, isLoading: false };
  if (payments.some(p => p.status === 'approved')) return { isPremium: true, isLoading: false };
  if (isWithinTrial(user)) return { isPremium: true, isLoading: false };

  return { isPremium: false, isLoading: false };
}