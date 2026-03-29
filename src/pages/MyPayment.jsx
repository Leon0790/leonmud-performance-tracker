import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle, Clock, XCircle, CreditCard, Phone, Shield, Sparkles, AlertCircle, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { usePremium, trialDaysLeft } from '@/hooks/use-premium';
import { format, addDays, addMonths } from 'date-fns';

const isValidMpesaFormat = (code) => /^[A-Z][A-Z0-9]{9}$/.test(code);

const PLANS = [
  { label: 'Monthly', amount: 200, badge: 'Popular', months: 1 },
  { label: 'Per Term', amount: 500, badge: 'Best Value', months: 3 },
];

export default function MyPayment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mpesaCode, setMpesaCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payment', user?.email],
    queryFn: () => base44.entities.Payment.filter({ teacher_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ['all-payments-check'],
    queryFn: () => base44.entities.Payment.list(),
    enabled: !!user?.email,
  });

  const payment = payments[0] || null;
  const daysLeft = trialDaysLeft(user);
  const isInTrial = daysLeft > 0 && payment?.status !== 'approved';

  // Estimate expiry based on approval date or now
  const approvalDate = payment?.updated_date ? new Date(payment.updated_date) : new Date();
  const expiryDate = payment?.status === 'approved'
    ? addMonths(approvalDate, selectedPlan.months)
    : null;

  const submitMutation = useMutation({
    mutationFn: async () => {
      const code = mpesaCode.trim().toUpperCase();
      setCodeError('');

      if (!isValidMpesaFormat(code)) {
        setCodeError('Invalid code format — must be exactly 10 characters (e.g. QGH3X7ABCD).');
        throw new Error('invalid_format');
      }

      const alreadyUsed = allPayments.some(p => p.mpesa_code === code);
      if (alreadyUsed) {
        setCodeError('This M-Pesa code has already been used. Please use a different transaction.');
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
      toast({ title: '🎉 Payment received! Premium access is now active.' });
      setMpesaCode('');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">My Subscription</h1>
          <p className="text-muted-foreground text-sm">Manage your LeonMud premium access</p>
        </div>
      </div>

      {/* Trial status */}
      {isInTrial && payment?.status !== 'pending' && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${daysLeft <= 2 ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
          <Clock className={`w-5 h-5 mt-0.5 shrink-0 ${daysLeft <= 2 ? 'text-red-600' : 'text-amber-600'}`} />
          <div>
            <p className={`font-semibold text-sm ${daysLeft <= 2 ? 'text-red-800' : 'text-amber-800'}`}>
              Free Trial Active — {daysLeft} day{daysLeft === 1 ? '' : 's'} remaining
            </p>
            <p className={`text-xs mt-0.5 ${daysLeft <= 2 ? 'text-red-700' : 'text-amber-700'}`}>
              {daysLeft <= 2
                ? 'Your trial expires soon. Submit your payment below to avoid losing access to premium features.'
                : 'You have full access during your trial. Pay before it ends to keep your premium features.'}
            </p>
          </div>
        </div>
      )}

      {/* Approved */}
      {payment?.status === 'approved' ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center pb-3">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-700">Payment Approved ✓</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">Your account is active with full premium access.</p>
            <div className="bg-white rounded-xl p-4 text-sm border border-green-200 space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">M-Pesa Code</span>
                <span className="font-mono font-bold text-green-700">{payment.mpesa_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-semibold">KES {payment.amount || 200}</span>
              </div>
              {expiryDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Expires</span>
                  <span className="font-semibold">{format(expiryDate, 'dd MMM yyyy')}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-green-700">
              <Shield className="w-3.5 h-3.5" /> All premium features are unlocked
            </div>
          </CardContent>
        </Card>

      ) : payment?.status === 'pending' ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="text-center pb-3">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-amber-700">Payment Under Review</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Your code <span className="font-mono font-bold text-foreground">{payment.mpesa_code}</span> has been submitted and is awaiting admin approval.
            </p>
            <div className="bg-white rounded-lg p-3 text-sm border border-amber-200">
              <p className="font-medium">Need faster approval?</p>
              <p className="text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Phone className="w-3.5 h-3.5" /> Call/WhatsApp: <strong>0700938979</strong>
              </p>
            </div>
          </CardContent>
        </Card>

      ) : payment?.status === 'rejected' ? (
        <Card className="border-destructive/30">
          <CardHeader className="text-center pb-3">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Payment Rejected</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm text-center">
              Your payment code was rejected. Please send a new M-Pesa payment and submit the new code below.
            </p>
            <PlanSelector plans={PLANS} selected={selectedPlan} onSelect={setSelectedPlan} />
            <PaymentInstructions amount={selectedPlan.amount} />
            <PaymentForm
              mpesaCode={mpesaCode}
              setMpesaCode={setMpesaCode}
              onSubmit={() => submitMutation.mutate()}
              isSubmitting={submitMutation.isPending}
              codeError={codeError}
              setCodeError={setCodeError}
            />
          </CardContent>
        </Card>

      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Upgrade to Premium
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <PlanSelector plans={PLANS} selected={selectedPlan} onSelect={setSelectedPlan} />

            {/* Features list */}
            <div className="bg-muted/40 rounded-xl p-4 space-y-2 text-sm">
              <p className="font-semibold">What you unlock:</p>
              {['Download & print report cards', 'Advanced analytics & charts', 'School logo & branding', 'Head teacher comments & signatures', 'Bulk PDF export'].map(f => (
                <div key={f} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <PaymentInstructions amount={selectedPlan.amount} />

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <Shield className="w-4 h-4 text-green-600 shrink-0" />
              Secure payment via M-Pesa. No hidden charges. Access granted within minutes of approval.
            </div>

            <PaymentForm
              mpesaCode={mpesaCode}
              setMpesaCode={setMpesaCode}
              onSubmit={() => submitMutation.mutate()}
              isSubmitting={submitMutation.isPending}
              codeError={codeError}
              setCodeError={setCodeError}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PlanSelector({ plans, selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {plans.map(plan => (
        <button
          key={plan.label}
          onClick={() => onSelect(plan)}
          className={`relative rounded-xl border-2 p-4 text-left transition-all ${
            selected.label === plan.label ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
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
  );
}

function PaymentInstructions({ amount }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2 text-sm">
      <p className="font-semibold text-primary flex items-center gap-1.5">
        <Phone className="w-4 h-4" /> M-Pesa Payment Instructions
      </p>
      <ol className="text-muted-foreground space-y-1 list-decimal list-inside">
        <li>Open <strong>M-Pesa</strong> on your phone</li>
        <li>Select <strong>Send Money</strong></li>
        <li>Enter number: <strong className="text-foreground">0700938979</strong></li>
        <li>Enter amount: <strong className="text-foreground">KES {amount}</strong></li>
        <li>Enter your PIN and confirm</li>
        <li>Copy the <strong>transaction code</strong> from the SMS you receive</li>
        <li>Paste it in the box below and submit</li>
      </ol>
      <div className="mt-2 pt-2 border-t border-primary/20">
        <p className="font-medium text-foreground">Payee: <span className="text-primary">Leonard Mudinyu</span></p>
      </div>
    </div>
  );
}

function PaymentForm({ mpesaCode, setMpesaCode, onSubmit, isSubmitting, codeError, setCodeError }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>M-Pesa Transaction Code</Label>
        <Input
          placeholder="e.g. QGH3X7ABCD"
          value={mpesaCode}
          onChange={(e) => { setMpesaCode(e.target.value.toUpperCase()); setCodeError(''); }}
          className={`font-mono tracking-widest text-center text-lg h-12 mt-1 ${codeError ? 'border-destructive' : ''}`}
          maxLength={10}
        />
        {codeError && (
          <div className="flex items-center gap-1.5 text-xs text-destructive mt-1">
            <AlertCircle className="w-3.5 h-3.5" /> {codeError}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">10-character code from your M-Pesa SMS, e.g. QGH3X7ABCD</p>
      </div>
      <Button
        onClick={onSubmit}
        disabled={mpesaCode.trim().length < 10 || isSubmitting}
        className="w-full h-11 text-base"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Verifying code...
          </span>
        ) : 'Submit Payment Code'}
      </Button>
    </div>
  );
}