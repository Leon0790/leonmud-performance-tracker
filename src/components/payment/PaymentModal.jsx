import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles, Shield } from 'lucide-react';
import MpesaCheckout from '@/components/payments/MpesaCheckout';
import { useAccount } from '@/hooks/use-account';
import { useQueryClient } from '@tanstack/react-query';

const PLANS = [
  { key: 'monthly', label: 'Monthly', price: 500 },
  { key: 'annual', label: 'Annual', price: 5500 },
];

export default function PaymentModal({ open, onOpenChange, feature }) {
  const { user } = useAccount();
  const queryClient = useQueryClient();
  const [plan, setPlan] = useState('monthly');
  const [checkout, setCheckout] = useState(false);

  const selected = PLANS.find((p) => p.key === plan);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md w-full mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-amber-500" /> Unlock the full platform
            </DialogTitle>
            {feature && (
              <DialogDescription>
                <span className="font-medium text-foreground">"{feature}"</span> needs an active subscription.
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {PLANS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPlan(p.key)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    plan === p.key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-bold text-base">KSh {p.price.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{p.label} · per teacher</p>
                </button>
              ))}
            </div>

            <div className="bg-muted/40 rounded-xl p-4 space-y-2 text-sm">
              {['Report cards, marklists and PDF exports', 'Performance analytics and school dashboards', 'Attendance and learner registers', 'Parent SMS & WhatsApp results'].map((f) => (
                <div key={f} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> <span>{f}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <Shield className="w-4 h-4 text-green-600 shrink-0" />
              Secure M-Pesa payment. Access activates after verification.
            </div>

            <Button className="w-full text-base h-11" onClick={() => setCheckout(true)} disabled={!user?.email}>
              Pay KSh {selected.price.toLocaleString()} via M-Pesa
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              Buying for a whole school? Use Subscription in the menu to cover several teachers at once.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <MpesaCheckout
        open={checkout}
        onOpenChange={(v) => {
          setCheckout(v);
          if (!v) {
            queryClient.invalidateQueries({ queryKey: ['my-licences'] });
            queryClient.invalidateQueries({ queryKey: ['payment'] });
          }
        }}
        payload={{ category: 'platform_subscription', plan, target_emails: [user?.email].filter(Boolean) }}
        amount={selected.price}
        summary={`${selected.label} subscription`}
        onPaid={() => {
          queryClient.invalidateQueries({ queryKey: ['my-licences'] });
          queryClient.invalidateQueries({ queryKey: ['payment'] });
        }}
      />
    </>
  );
}