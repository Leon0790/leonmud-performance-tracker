import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const TRIAL_DAYS = 7;

export function trialDaysLeft(user) {
  if (!user?.created_date) return 0;
  const created = new Date(user.created_date);
  const msLeft = TRIAL_DAYS * 24 * 60 * 60 * 1000 - (new Date() - created);
  return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
}

function isWithinTrial(user) {
  return trialDaysLeft(user) > 0;
}

/**
 * Returns { isPremium, isLoading, isInTrial, trialDaysLeft, approvedPayment }
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

  if (isLoading) return { isPremium: false, isLoading: true, isInTrial: false, trialDaysLeft: 0, approvedPayment: null };

  if (!user) return { isPremium: false, isLoading: false, isInTrial: false, trialDaysLeft: 0, approvedPayment: null };

  if (user.role === 'admin') return { isPremium: true, isLoading: false, isInTrial: false, trialDaysLeft: 0, approvedPayment: null };

  const approvedPayment = payments.find(p => p.status === 'approved') || null;
  if (approvedPayment) return { isPremium: true, isLoading: false, isInTrial: false, trialDaysLeft: 0, approvedPayment };

  const daysLeft = trialDaysLeft(user);
  if (daysLeft > 0) return { isPremium: true, isLoading: false, isInTrial: true, trialDaysLeft: daysLeft, approvedPayment: null };

  return { isPremium: false, isLoading: false, isInTrial: false, trialDaysLeft: 0, approvedPayment: null };
}