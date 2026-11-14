import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BookOpen, CheckCircle2, Users, Receipt, Lock } from 'lucide-react';
import MpesaCheckout from '@/components/payments/MpesaCheckout';
import ChipSelect from '@/components/school/ChipSelect';
import { useAccount } from '@/hooks/use-account';
import { LEARNING_AREAS, TERMS, ACADEMIC_YEARS, currentAcademicYear } from '@/utils/learningAreas';
import { format } from 'date-fns';

const UNIT_PRICE = 100;

export default function LessonPlanAccess() {
  const { user, schoolId, schoolName, isHeadteacher, isSuperAdmin, loading, account } = useAccount();
  const queryClient = useQueryClient();
  const [forTeachers, setForTeachers] = useState(false);
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [term, setTerm] = useState('Term 1');
  const [areas, setAreas] = useState([]);
  const [targets, setTargets] = useState([]);
  const [checkout, setCheckout] = useState(false);

  const { data: teachers = [] } = useQuery({
    queryKey: ['school-teachers', schoolId],
    queryFn: () => base44.entities.TeacherProfile.filter({ school_id: schoolId }, 'teacher_name', 200),
    enabled: !!schoolId && isHeadteacher,
  });

  const { data: entitlements = [], isLoading: loadingEntitlements } = useQuery({
    queryKey: ['lesson-entitlements', schoolId, user?.email, isHeadteacher],
    queryFn: () =>
      isHeadteacher
        ? base44.entities.LessonPlanEntitlement.filter({ school_id: schoolId }, '-created_date', 300)
        : base44.entities.LessonPlanEntitlement.filter({ teacher_email: user?.email }, '-created_date', 200),
    enabled: !!user?.email,
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['lesson-payments', schoolId, user?.email],
    queryFn: () =>
      isHeadteacher && schoolId
        ? base44.entities.Payment.filter({ school_id: schoolId, category: 'lesson_plan' }, '-created_date', 100)
        : base44.entities.Payment.filter({ payer_email: user?.email, category: 'lesson_plan' }, '-created_date', 100),
    enabled: !!user?.email,
  });

  const effectiveTargets = forTeachers && targets.length ? targets : [user?.email].filter(Boolean);
  const total = areas.length * effectiveTargets.length * UNIT_PRICE;
  const canBuy = areas.length > 0 && effectiveTargets.length > 0 && term && academicYear;

  const owned = useMemo(() => {
    const list = Array.isArray(entitlements) ? entitlements : (entitlements.items || []);
    return list.filter((e) => e.status !== 'revoked');
  }, [entitlements]);

  const unlockedFor = (email) =>
    owned.filter((e) => e.teacher_email === email && e.term === term && e.academic_year === academicYear && e.status !== 'revoked');

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['lesson-entitlements'] });
    queryClient.invalidateQueries({ queryKey: ['lesson-payments'] });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" /> Lesson plan access
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          KSh {UNIT_PRICE} per learning area, per term. Each learning area and term is purchased separately.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          {!account?.free_lesson_plan_used ? (
            <div className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 text-green-800 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              You still have your one free lesson-plan generation.
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs bg-muted border rounded-lg px-3 py-2 text-muted-foreground">
              <Lock className="w-4 h-4 shrink-0" />
              Your free generation has been used — buy the learning area and term you need.
            </div>
          )}

          {isHeadteacher && (
            <div className="flex gap-2">
              <Button variant={forTeachers ? 'outline' : 'default'} size="sm" onClick={() => setForTeachers(false)}>
                For myself
              </Button>
              <Button variant={forTeachers ? 'default' : 'outline'} size="sm" className="gap-1.5" onClick={() => setForTeachers(true)}>
                <Users className="w-3.5 h-3.5" /> For my teachers
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Academic year</Label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{ACADEMIC_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {forTeachers && (
            <div>
              <Label className="text-xs text-muted-foreground">Teachers</Label>
              <div className="mt-1">
                {teachers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No teachers in your school yet.</p>
                ) : (
                  <ChipSelect
                    options={teachers.map((t) => t.teacher_email)}
                    value={targets}
                    onChange={setTargets}
                  />
                )}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground">Learning areas</Label>
            <div className="mt-1">
              <ChipSelect options={LEARNING_AREAS} value={areas} onChange={setAreas} />
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <div>
              <p className="text-xs text-muted-foreground">
                {areas.length} learning area(s) × {effectiveTargets.length} teacher(s) × KSh {UNIT_PRICE}
              </p>
              <p className="text-xl font-bold">KSh {total.toLocaleString()}</p>
            </div>
            <Button disabled={!canBuy} onClick={() => setCheckout(true)}>Pay with M-Pesa</Button>
          </div>
        </CardContent>
      </Card>

      {isHeadteacher && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-semibold">Unlocked for {term} {academicYear}</p>
            {teachers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No teachers yet.</p>
            ) : (
              <div className="space-y-1.5">
                {teachers.map((t) => {
                  const list = unlockedFor(t.teacher_email);
                  return (
                    <div key={t.id} className="flex items-start justify-between gap-2 text-xs">
                      <span className="text-muted-foreground truncate">{t.teacher_name || t.teacher_email}</span>
                      <span className="text-right shrink-0 max-w-[55%]">
                        {list.length === 0 ? (
                          <span className="text-muted-foreground">none</span>
                        ) : (
                          list.map((e) => (
                            <Badge key={e.id} variant="outline" className="text-[10px] mr-1 mb-1">{e.learning_area}</Badge>
                          ))
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-2">
          <p className="text-sm font-semibold">
            {isHeadteacher ? 'Your unlocked learning areas' : 'My unlocked learning areas'}
          </p>
          {loadingEntitlements ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : owned.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nothing unlocked yet.</p>
          ) : (
            <div className="space-y-1.5">
              {owned.slice(0, 40).map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate">
                    <span className="font-medium">{e.learning_area}</span>
                    <span className="text-muted-foreground"> · {e.term} {e.academic_year}</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {isHeadteacher ? e.teacher_email : e.source === 'trial' ? 'free trial' : 'purchased'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <p className="text-sm font-semibold flex items-center gap-1.5"><Receipt className="w-4 h-4" /> Purchase history</p>
          {purchases.length === 0 ? (
            <p className="text-xs text-muted-foreground">No lesson-plan purchases yet.</p>
          ) : (
            <div className="space-y-1.5">
              {purchases.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-muted-foreground">{p.notes}</span>
                  <span className="shrink-0 flex items-center gap-1.5">
                    <span className="font-medium">KSh {Number(p.amount).toLocaleString()}</span>
                    <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {p.created_date ? format(new Date(p.created_date), 'd MMM yy') : ''}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <MpesaCheckout
        open={checkout}
        onOpenChange={setCheckout}
        payload={{
          category: 'lesson_plan',
          term,
          academic_year: academicYear,
          learning_areas: areas,
          target_emails: effectiveTargets,
        }}
        amount={total}
        summary={`${areas.length} learning area(s) · ${term} ${academicYear} · ${effectiveTargets.length} teacher(s)`}
        onPaid={refresh}
      />
    </div>
  );
}