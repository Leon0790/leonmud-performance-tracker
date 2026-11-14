import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Shield, Users, Receipt, Clock } from 'lucide-react';
import MpesaCheckout from '@/components/payments/MpesaCheckout';
import ChipSelect from '@/components/school/ChipSelect';
import { useAccount } from '@/hooks/use-account';
import { usePremium } from '@/hooks/use-premium';
import { format } from 'date-fns';

const PLANS = [
  { key: 'monthly', label: 'Monthly', price: 500, note: 'per teacher, billed monthly' },
  { key: 'annual', label: 'Annual', price: 5500, note: 'per teacher, billed yearly' },
];

const BENEFITS = [
  'Marks entry, marklists and CBC banding for every learning area',
  'Report cards, progress reports and PDF exports',
  'Performance graphs and whole-school analytics',
  'Attendance, learner registers and parent SMS/WhatsApp',
];

export default function Subscribe() {
  const { user, schoolId, schoolName, isHeadteacher, loading } = useAccount();
  const { isInTrial, trialDaysLeft, licence, subExpiry } = usePremium();
  const queryClient = useQueryClient();
  const [plan, setPlan] = useState('monthly');
  const [forTeachers, setForTeachers] = useState(false);
  const [targets, setTargets] = useState([]);
  const [checkout, setCheckout] = useState(false);

  const { data: teachers = [] } = useQuery({
    queryKey: ['school-teachers', schoolId],
    queryFn: () => base44.entities.TeacherProfile.filter({ school_id: schoolId }, 'teacher_name', 200),
    enabled: !!schoolId && isHeadteacher,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['my-subscription-payments', schoolId, user?.email],
    queryFn: () =>
      isHeadteacher && schoolId
        ? base44.entities.Payment.filter({ school_id: schoolId, category: 'platform_subscription' }, '-created_date', 50)
        : base44.entities.Payment.filter({ payer_email: user?.email, category: 'platform_subscription' }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const selectedPlan = PLANS.find((p) => p.key === plan);
  const effectiveTargets = forTeachers && targets.length ? targets : [user?.email].filter(Boolean);
  const total = selectedPlan.price * effectiveTargets.length;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Subscription</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {schoolName ? `${schoolName} · ` : ''}KSh 500 monthly or KSh 5,500 annual per teacher
        </p>
      </div>

      {licence ? (
        <Card className="border-green-200 bg-green-50/60">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-green-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Active {licence.plan} licence
              </p>
              <p className="text-xs text-green-800/80">
                Valid until {format(new Date(licence.period_end), 'd MMM yyyy')}
              </p>
            </div>
            <Badge variant="outline" className="text-[11px] border-green-300 text-green-800">
              {Math.max(0, Math.ceil((new Date(licence.period_end) - new Date()) / 86400000))} days left
            </Badge>
          </CardContent>
        </Card>
      ) : isInTrial ? (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="p-4 flex items-center gap-2 text-sm text-amber-900">
            <Clock className="w-4 h-4 shrink-0" />
            Free trial — {trialDaysLeft} day(s) left. Subscribe to keep your records and continue after it ends.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Your trial has ended. Your learners, marks and reports are safely stored — subscribe to continue using them.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        {PLANS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPlan(p.key)}
            className={`rounded-xl border-2 p-4 text-left transition-all ${plan === p.key ? 'border-primary bg-primary/5' : 'border-border'}`}
          >
            <p className="font-bold text-lg">KSh {p.price.toLocaleString()}</p>
            <p className="text-sm font-medium">{p.label}</p>
            <p className="text-xs text-muted-foreground">{p.note}</p>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold">What your subscription covers</p>
          {BENEFITS.map((b) => (
            <div key={b} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> {b}
            </div>
          ))}
        </CardContent>
      </Card>

      {isHeadteacher && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2">
              <Button size="sm" variant={forTeachers ? 'outline' : 'default'} onClick={() => setForTeachers(false)}>My licence</Button>
              <Button size="sm" variant={forTeachers ? 'default' : 'outline'} className="gap-1.5" onClick={() => setForTeachers(true)}>
                <Users className="w-3.5 h-3.5" /> Buy for teachers
              </Button>
            </div>
            {forTeachers && (
              teachers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No teachers in your school yet.</p>
              ) : (
                <ChipSelect options={teachers.map((t) => t.teacher_email)} value={targets} onChange={setTargets} />
              )
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between border-t pt-3">
        <div>
          <p className="text-xs text-muted-foreground">
            {selectedPlan.label} × {effectiveTargets.length} teacher(s)
          </p>
          <p className="text-xl font-bold">KSh {total.toLocaleString()}</p>
        </div>
        <Button onClick={() => setCheckout(true)} disabled={!effectiveTargets.length}>Pay with M-Pesa</Button>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Shield className="w-3.5 h-3.5" /> Every payment is verified with M-Pesa before access is activated.
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <p className="text-sm font-semibold flex items-center gap-1.5"><Receipt className="w-4 h-4" /> Payment history</p>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">No subscription payments yet.</p>
          ) : (
            history.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-muted-foreground">{p.notes || p.reference || 'Subscription'}</span>
                <span className="shrink-0 flex items-center gap-1.5">
                  <span className="font-medium">KSh {Number(p.amount).toLocaleString()}</span>
                  <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                  <span className="text-[11px] text-muted-foreground">{p.receipt_no || (p.created_date ? format(new Date(p.created_date), 'd MMM yy') : '')}</span>
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <MpesaCheckout
        open={checkout}
        onOpenChange={setCheckout}
        payload={{ category: 'platform_subscription', plan, target_emails: effectiveTargets }}
        amount={total}
        summary={`${selectedPlan.label} subscription · ${effectiveTargets.length} teacher(s)`}
        onPaid={() => {
          queryClient.invalidateQueries({ queryKey: ['my-licences'] });
          queryClient.invalidateQueries({ queryKey: ['my-subscription-payments'] });
          queryClient.invalidateQueries({ queryKey: ['platform-account'] });
        }}
      />
    </div>
  );
}