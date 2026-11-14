import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { addMonths } from 'date-fns';

const TRIAL_DAYS = 3;

/** Trial day counter. The start timestamp is stamped once by the server and never reset. */
export function trialDaysLeft(user) {
  const start = user?.trial_started_at || user?.created_date;
  if (!start) return 0;
  const msLeft = TRIAL_DAYS * 24 * 60 * 60 * 1000 - (new Date() - new Date(start));
  return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
}

/** Legacy approved payments keep working: 200 = 1 month, 500 = 3 months. */
export function getPaymentExpiry(payment) {
  if (!payment) return null;
  const start = new Date(payment.updated_date || payment.created_date);
  const months = payment.amount >= 500 ? 3 : 1;
  return addMonths(start, months);
}

export function subscriptionDaysLeft(payment) {
  const expiry = getPaymentExpiry(payment);
  if (!expiry) return 0;
  return Math.max(0, Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)));
}

const EMPTY = {
  isPremium: false,
  isLoading: false,
  isInTrial: false,
  trialDaysLeft: 0,
  approvedPayment: null,
  subDaysLeft: 0,
  subExpiry: null,
  licence: null,
};

export function usePremium() {
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: account, isLoading: loadingAccount } = useQuery({
    queryKey: ['platform-account', user?.email],
    queryFn: async () => (await base44.functions.invoke('platformAccount', { action: 'sync' })).data,
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  const { data: licences = [], isLoading: loadingLicences } = useQuery({
    queryKey: ['my-licences', user?.email],
    queryFn: () => base44.entities.PlatformLicence.filter({ teacher_email: user?.email }, '-period_end', 20),
    enabled: !!user?.email,
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['payment', user?.email],
    queryFn: () => base44.entities.Payment.filter({ teacher_email: user?.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const isLoading = loadingUser || loadingAccount || loadingLicences || loadingPayments;
  if (isLoading) return { ...EMPTY, isLoading: true };
  if (!user) return { ...EMPTY };

  const userType = account?.user_type || (user.role === 'admin' ? 'super_admin' : 'teacher');
  if (user.role === 'admin' || userType === 'super_admin' || userType === 'headteacher') {
    return { ...EMPTY, isPremium: true, subDaysLeft: 999, userType };
  }

  const list = Array.isArray(licences) ? licences : (licences.items || []);
  const liveLicence = list.find(l => l.status !== 'expired' && new Date(l.period_end) > new Date());
  if (liveLicence) {
    return {
      ...EMPTY,
      isPremium: true,
      licence: liveLicence,
      subDaysLeft: Math.max(0, Math.ceil((new Date(liveLicence.period_end) - new Date()) / 86400000)),
      subExpiry: new Date(liveLicence.period_end),
      userType,
    };
  }

  const legacyList = Array.isArray(payments) ? payments : (payments.items || []);
  const legacyActive = legacyList
    .filter(p => p.status === 'approved' && (!p.category || p.category === 'legacy'))
    .find(p => subscriptionDaysLeft(p) > 0);
  if (legacyActive) {
    return {
      ...EMPTY,
      isPremium: true,
      approvedPayment: legacyActive,
      subDaysLeft: subscriptionDaysLeft(legacyActive),
      subExpiry: getPaymentExpiry(legacyActive),
      userType,
    };
  }

  const daysLeft = trialDaysLeft({ ...user, trial_started_at: account?.trial_started_at });
  if (daysLeft > 0) {
    return { ...EMPTY, isPremium: true, isInTrial: true, trialDaysLeft: daysLeft, userType };
  }

  return { ...EMPTY, userType };
}