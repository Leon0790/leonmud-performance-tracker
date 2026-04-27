import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { addMonths } from 'date-fns';

const TRIAL_DAYS = 7;

export function trialDaysLeft(user) {
  if (!user?.created_date) return 0;
  const created = new Date(user.created_date);
  const msLeft = TRIAL_DAYS * 24 * 60 * 60 * 1000 - (new Date() - created);
  return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
}

/**
 * Given an approved payment, returns the expiry Date based on amount:
 *   200 = 1 month, 500 = 3 months
 * Uses updated_date (approval date) as the start.
 */
export function getPaymentExpiry(payment) {
  if (!payment) return null;
  const start = new Date(payment.updated_date || payment.created_date);
  const months = payment.amount >= 500 ? 3 : 1;
  return addMonths(start, months);
}

/**
 * Returns days remaining on an approved subscription (0 if expired).
 */
export function subscriptionDaysLeft(payment) {
  const expiry = getPaymentExpiry(payment);
  if (!expiry) return 0;
  const msLeft = expiry - new Date();
  return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
}

/**
 * Returns { isPremium, isLoading, isInTrial, trialDaysLeft, approvedPayment, subDaysLeft, subExpiry }
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

  if (isLoading) return { isPremium: false, isLoading: true, isInTrial: false, trialDaysLeft: 0, approvedPayment: null, subDaysLeft: 0, subExpiry: null };

  if (!user) return { isPremium: false, isLoading: false, isInTrial: false, trialDaysLeft: 0, approvedPayment: null, subDaysLeft: 0, subExpiry: null };

  if (user.role === 'admin') return { isPremium: true, isLoading: false, isInTrial: false, trialDaysLeft: 0, approvedPayment: null, subDaysLeft: 999, subExpiry: null };

  // Find the most recently approved payment that hasn't expired yet
  const approvedPayments = payments.filter(p => p.status === 'approved');
  const activePayment = approvedPayments.find(p => subscriptionDaysLeft(p) > 0) || null;

  if (activePayment) {
    const daysLeft = subscriptionDaysLeft(activePayment);
    const expiry = getPaymentExpiry(activePayment);
    return { isPremium: true, isLoading: false, isInTrial: false, trialDaysLeft: 0, approvedPayment: activePayment, subDaysLeft: daysLeft, subExpiry: expiry };
  }

  // Check trial
  const daysLeft = trialDaysLeft(user);
  if (daysLeft > 0) return { isPremium: true, isLoading: false, isInTrial: true, trialDaysLeft: daysLeft, approvedPayment: null, subDaysLeft: 0, subExpiry: null };

  return { isPremium: false, isLoading: false, isInTrial: false, trialDaysLeft: 0, approvedPayment: null, subDaysLeft: 0, subExpiry: null };
}