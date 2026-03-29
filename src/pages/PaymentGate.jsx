import React from 'react';
import { usePremium } from '@/hooks/use-premium';
import TrialBanner from '@/components/payment/TrialBanner';

/**
 * PaymentGate no longer blocks the full app.
 * It simply renders a trial countdown banner when the user is in trial mode.
 * Premium feature gating is handled by PremiumLock at the feature level.
 */
export default function PaymentGate({ children }) {
  const { isInTrial, trialDaysLeft, isPremium, isLoading, approvedPayment } = usePremium();

  return (
    <>
      {!isLoading && isInTrial && (
        <TrialBanner daysLeft={trialDaysLeft} />
      )}
      {children}
    </>
  );
}