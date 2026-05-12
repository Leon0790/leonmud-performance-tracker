import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, BookOpen, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const FEATURES = [
  'AI-generated CBC lesson plans for all grades 1–9',
  'All subjects and learning areas',
  'Customisable after generation',
  'Download / Print as PDF',
  'Reflection & teacher notes section',
];

export default function LessonPlanSubscriptionGate({ user, children }) {
  const [mpesaCode, setMpesaCode] = useState('');
  const [plan, setPlan] = useState('monthly');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Check if user has a lesson plan subscription (approved payment)
  const { data: payments = [] } = useQuery({
    queryKey: ['lesson-plan-payments', user?.email],
    queryFn: () => base44.entities.Payment.filter({ teacher_email: user?.email, status: 'approved' }),
    enabled: !!user?.email,
  });

  // Check if there is any approved lesson plan payment
  const hasAccess = payments.some(p => p.lesson_plan_subscription === true) || 
                    payments.some(p => p.notes?.includes('lesson_plan'));

  // For simplicity, check if user has ANY approved payment (same payment system)
  const hasAnyPayment = payments.length > 0;

  if (hasAnyPayment) {
    return children;
  }

  if (submitted) {
    return (
      <div className="p-6 max-w-md mx-auto text-center space-y-4 py-20">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
        <h2 className="text-xl font-bold">Payment Submitted!</h2>
        <p className="text-muted-foreground">Your M-Pesa payment is pending admin approval. You will gain access once approved.</p>
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
        mpesa_code: mpesaCode.trim(),
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
        <h2 className="text-2xl font-bold">Lesson Plan Generator</h2>
        <p className="text-muted-foreground text-sm">AI-powered CBC lesson plans for Grades 1–9</p>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className={`cursor-pointer border-2 transition-all ${plan === 'monthly' ? 'border-primary' : 'border-border'}`}
          onClick={() => setPlan('monthly')}>
          <CardContent className="p-4 text-center space-y-1">
            <p className="font-bold text-lg">KES 300</p>
            <p className="text-sm text-muted-foreground">Per Month</p>
            <Badge variant="outline" className="text-xs">Flexible</Badge>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer border-2 transition-all ${plan === 'term' ? 'border-green-600' : 'border-border'}`}
          onClick={() => setPlan('term')}>
          <CardContent className="p-4 text-center space-y-1">
            <p className="font-bold text-lg">KES 1,000</p>
            <p className="text-sm text-muted-foreground">Per Term</p>
            <Badge className="text-xs bg-green-600">Best Value</Badge>
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
          <p className="text-xs text-muted-foreground">Send <strong>KES {plan === 'monthly' ? 300 : 1000}</strong> to <strong>0712 345 678</strong> (or your school's M-Pesa number) then enter the transaction code below.</p>
          <div>
            <Label className="text-xs text-muted-foreground">M-Pesa Transaction Code</Label>
            <Input className="mt-1 font-mono uppercase" placeholder="e.g. QGX1234ABC" value={mpesaCode} onChange={e => setMpesaCode(e.target.value.toUpperCase())} />
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