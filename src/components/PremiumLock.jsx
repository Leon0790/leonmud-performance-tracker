import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import PaymentModal from '@/components/payment/PaymentModal';

/**
 * Wraps children with a premium lock.
 * mode="overlay" — blurs children and shows lock badge (default)
 * mode="block"   — replaces children entirely with an upgrade banner
 *
 * Clicking the lock opens the PaymentModal directly (no redirect).
 */
export default function PremiumLock({ isPremium, isLoading, feature, mode = 'overlay', children }) {
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading || isPremium) return children;

  if (mode === 'block') {
    return (
      <>
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 p-6 flex flex-col items-center text-center gap-3 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => setModalOpen(true)}
        >
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-amber-800">Premium Feature</p>
            <p className="text-sm text-amber-700 mt-0.5">{feature} requires a paid plan.</p>
            <p className="text-xs text-amber-600 mt-1">To continue using this feature, please upgrade your account.</p>
          </div>
          <span className="text-xs font-semibold px-4 py-1.5 rounded-full bg-amber-500 text-white">
            Upgrade → KES 200/month
          </span>
        </div>
        <PaymentModal open={modalOpen} onOpenChange={setModalOpen} feature={feature} />
      </>
    );
  }

  // overlay mode
  return (
    <>
      <div className="relative inline-flex">
        <div className="opacity-40 pointer-events-none select-none">{children}</div>
        <button
          onClick={() => setModalOpen(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/60 backdrop-blur-[2px] rounded-md group"
          title={`Unlock ${feature}`}
        >
          <div className="flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
            <Lock className="w-3 h-3" /> Premium
          </div>
        </button>
      </div>
      <PaymentModal open={modalOpen} onOpenChange={setModalOpen} feature={feature} />
    </>
  );
}