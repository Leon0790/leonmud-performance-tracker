import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, CheckCircle, Clock, Phone, AlertCircle, Sparkles } from 'lucide-react';

const PLANS = [
  { label: 'Monthly', amount: 200, badge: 'Popular' },
  { label: 'Per Term', amount: 500, badge: 'Best Value' },
];

const isValidMpesaFormat = (code) => /^[A-Z][A-Z0-9]{9}$/.test(code);

export default function PaymentModal({ open, onOpenChange, feature }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState('pricing'); // 'pricing' | 'pay' | 'pending' | 'success'
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);
  const [mpesaCode, setMpesaCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ['all-payments-check'],
    queryFn: () => base44.entities.Payment.list(),
    enabled: !!user?.email,
  });

  const { data: myPayments = [] } = useQuery({
    queryKey: ['payment', user?.email],
    queryFn: () => base44.entities.Payment.filter({ teacher_email: user?.email }),
    enabled: !!user?.email,
  });

  const existingPending = myPayments.find(p => p.status === 'pending');

  const submitMutation = useMutation({
    mutationFn: async () => {
      const code = mpesaCode.trim().toUpperCase();
      setCodeError('');

      if (!isValidMpesaFormat(code)) {
        setCodeError('Invalid code format. Must be 10 characters, e.g. QGH3X7ABCD');
        throw new Error('invalid_format');
      }

      const alreadyUsed = allPayments.some(p => p.mpesa_code === code);
      if (alreadyUsed) {
        setCodeError('This M-Pesa code has already been used. Please use a new transaction.');
        throw new Error('duplicate_code');
      }

      return base44.entities.Payment.create({
        teacher_email: user.email,
        mpesa_code: code,
        status: 'approved',
        amount: selectedPlan.amount,
        approved_by: 'auto',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['all-payments-check'] });
      setStep('success');
      setMpesaCode('');
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('pricing');
      setMpesaCode('');
      setCodeError('');
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Unlock Premium Access
          </DialogTitle>
          {feature && (
            <DialogDescription>
              <span className="font-medium text-foreground">"{feature}"</span> requires a premium account. Upgrade to continue.
            </DialogDescription>
          )}
        </DialogHeader>

        {step === 'pricing' && (
          <div className="space-y-4">
            {/* Plan selector */}
            <div className="grid grid-cols-2 gap-3">
              {PLANS.map(plan => (
                <button
                  key={plan.label}
                  onClick={() => setSelectedPlan(plan)}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                    selectedPlan.label === plan.label
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="absolute -top-2.5 right-3 text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                    {plan.badge}
                  </span>
                  <p className="font-bold text-base">KES {plan.amount}</p>
                  <p className="text-sm text-muted-foreground">{plan.label}</p>
                </button>
              ))}
            </div>

            {/* What you get */}
            <div className="bg-muted/40 rounded-xl p-4 space-y-2 text-sm">
              <p className="font-semibold text-foreground">What you get:</p>
              {['Download & print report cards', 'Advanced performance analytics', 'School logo & branding', 'Head teacher comments & signatures', 'Bulk PDF export for entire class'].map(f => (
                <div key={f} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            {/* Trust line */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <Shield className="w-4 h-4 text-green-600 shrink-0" />
              Secure payment via M-Pesa. No hidden charges. Access granted within minutes.
            </div>

            <Button
              className="w-full text-base h-11"
              onClick={() => setStep('pay')}
            >
              Pay KES {selectedPlan.amount} via M-Pesa →
            </Button>
          </div>
        )}

        {step === 'pay' && (
          <div className="space-y-4">
            {existingPending && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                You already have a pending payment (<span className="font-mono font-bold">{existingPending.mpesa_code}</span>) awaiting admin approval.
              </div>
            )}

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2 text-sm">
              <p className="font-semibold text-primary flex items-center gap-1.5">
                <Phone className="w-4 h-4" /> M-Pesa Payment Instructions
              </p>
              <ol className="text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open <strong>M-Pesa</strong> on your phone</li>
                <li>Select <strong>Send Money</strong></li>
                <li>Enter number: <strong className="text-foreground">0700938979</strong></li>
                <li>Enter amount: <strong className="text-foreground">KES {selectedPlan.amount}</strong></li>
                <li>Enter your PIN and confirm</li>
                <li>Copy the <strong>transaction code</strong> from the SMS</li>
                <li>Paste it below</li>
              </ol>
              <div className="mt-2 pt-2 border-t border-primary/20">
                <p className="text-foreground font-medium">Payee: <span className="text-primary">Leonard Mudinyu</span></p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>M-Pesa Transaction Code</Label>
              <Input
                placeholder="e.g. QGH3X7ABCD"
                value={mpesaCode}
                onChange={(e) => { setMpesaCode(e.target.value.toUpperCase()); setCodeError(''); }}
                className={`font-mono tracking-widest text-center text-lg h-12 ${codeError ? 'border-destructive' : ''}`}
                maxLength={10}
                autoFocus
              />
              {codeError && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="w-3.5 h-3.5" /> {codeError}
                </div>
              )}
              <p className="text-xs text-muted-foreground">10-character code starting with a letter, e.g. QGH3X7ABCD</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('pricing')}>
                ← Back
              </Button>
              <Button
                className="flex-1 h-11"
                onClick={() => submitMutation.mutate()}
                disabled={mpesaCode.trim().length < 10 || submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : 'Submit Code'}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-lg">🎉 Premium Unlocked!</p>
              <p className="text-muted-foreground text-sm mt-1">
                Your payment has been received and your account is now fully activated. Enjoy all premium features!
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex items-center gap-2 justify-center">
              <Shield className="w-4 h-4 text-green-600" /> Full premium access granted
            </div>
            <Button className="w-full" onClick={handleClose}>
              Start using premium →
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}