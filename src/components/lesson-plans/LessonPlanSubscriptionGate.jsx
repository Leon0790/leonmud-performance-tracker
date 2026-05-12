import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, BookOpen, Sparkles, Gift } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const FREE_TRIAL_LIMIT = 2;

const FEATURES = [
  'Unlimited AI-generated CBC lesson plans',
  'All grades (1–9) and all subjects',
  'Fully customisable after generation',
  'Download / Print as PDF',
  'Teacher notes & reflection section',
];

export default function LessonPlanSubscriptionGate({ user, planCount, approvedPayments, children }) {
  const [mpesaCode, setMpesaCode] = useState('');
  const [plan, setPlan] = useState('monthly');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Has an approved lesson-plan payment?
  const hasPaidAccess = approvedPayments.some(p => p.notes?.includes('lesson_plan'));

  // Still within free trial?
  const isFreeTrial = planCount < FREE_TRIAL_LIMIT;

  // Allow access if free trial still valid OR paid
  if (hasPaidAccess || isFreeTrial) {
    return children;
  }

  // Show payment wall
  if (submitted) {
    return (
      <div className="p-6 max-w-md mx-auto text-center space-y-4 py-20">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
        <h2 className="text-xl font-bold">Payment Submitted!</h2>
        <p className="text-muted-foreground">Your M-Pesa code is pending admin approval. You will gain full access once approved.</p>
        <p className="text-sm font-mono bg-muted rounded px-3 py-2 inline-block">{mpesaCode}</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!mpesaCode.trim()) {
      toast({ title: 'Enter your M-Pesa transaction code', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.Payment.create({
        teacher_email: user?.email || '',
        mpesa_code: mpesaCode.trim().toUpperCase(),
        amount: plan === 'monthly' ? 300 : 1000,
        status: 'pending',
        notes: `lesson_plan_${plan}`,
      });
      setSubmitted(true);
    } catch (e) {
      toast({ title: 'Submission failed', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <BookOpen className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Unlock Lesson Plan Generator</h2>
        <p className="text-muted-foreground text-sm">
          You've used your <strong>{FREE_TRIAL_LIMIT} free trial</strong> plans. Subscribe to generate unlimited plans.
        </p>
      </div>

      {/* Trial used notice */}
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        <Gift className="w-4 h-4 shrink-0" />
        <span>Free trial: <strong>{planCount}/{FREE_TRIAL_LIMIT}</strong> plans used. Subscribe to continue.</span>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer border-2 transition-all ${plan === 'monthly' ? 'border-primary' : 'border-border'}`}
          onClick={() => setPlan('monthly')}
        >
          <CardContent className="p-4 text-center space-y-1">
            <p className="font-bold text-lg">KES 300</p>
            <p className="text-sm text-muted-foreground">Per Month</p>
            <Badge variant="outline" className="text-xs">Flexible</Badge>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer border-2 transition-all ${plan === 'term' ? 'border-green-600' : 'border-border'}`}
          onClick={() => setPlan('term')}
        >
          <CardContent className="p-4 text-center space-y-1">
            <p className="font-bold text-lg">KES 1,000</p>
            <p className="text-sm text-muted-foreground">Per Term</p>
            <Badge className="text-xs bg-green-600 text-white">Best Value</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <ul className="space-y-2">
        {FEATURES.map(f => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      {/* Payment */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold">Pay via M-Pesa</p>
          <p className="text-xs text-muted-foreground">
            Send <strong>KES {plan === 'monthly' ? 300 : 1000}</strong> to the school's M-Pesa number, then enter your transaction code below.
          </p>
          <div>
            <Label className="text-xs text-muted-foreground">M-Pesa Transaction Code</Label>
            <Input
              className="mt-1 font-mono uppercase"
              placeholder="e.g. QGX1234ABC"
              value={mpesaCode}
              onChange={e => setMpesaCode(e.target.value.toUpperCase())}
            />
          </div>
          <Button className="w-full gap-2" onClick={handleSubmit} disabled={submitting}>
            <Sparkles className="w-4 h-4" />
            {submitting ? 'Submitting...' : `Submit Payment — KES ${plan === 'monthly' ? 300 : 1000}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}