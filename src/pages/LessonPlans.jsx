import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Trash2, Edit3, Download, Sparkles } from 'lucide-react';
import LessonPlanEditor from '@/components/lesson-plans/LessonPlanEditor';
import LessonPlanGenerator from '@/components/lesson-plans/LessonPlanGenerator';
import LessonPlanPDFExport from '@/components/lesson-plans/LessonPlanPDFExport';
import LessonPlanSubscriptionGate from '@/components/lesson-plans/LessonPlanSubscriptionGate';

const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9'];
const TERMS = ['Term 1','Term 2','Term 3'];

export default function LessonPlans() {
  const [view, setView] = useState('list'); // 'list' | 'generate' | 'edit'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterTerm, setFilterTerm] = useState('all');
  const [showExport, setShowExport] = useState(null);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['lesson-plans', filterGrade, filterTerm],
    queryFn: async () => {
      const filter = {};
      if (filterGrade !== 'all') filter.grade = filterGrade;
      if (filterTerm !== 'all') filter.term = filterTerm;
      if (Object.keys(filter).length > 0) {
        return base44.entities.LessonPlan.filter(filter, '-created_date', 100);
      }
      return base44.entities.LessonPlan.list('-created_date', 100);
    },
  });

  // All plans by this user (for free trial count — unfiltered)
  const { data: allMyPlans = [] } = useQuery({
    queryKey: ['all-my-lesson-plans', user?.email],
    queryFn: () => base44.entities.LessonPlan.filter({ teacher_email: user?.email }, '-created_date', 200),
    enabled: !!user?.email,
  });

  // Approved payments for lesson plans
  const { data: approvedPayments = [] } = useQuery({
    queryKey: ['lesson-plan-approved-payments', user?.email],
    queryFn: () => base44.entities.Payment.filter({ teacher_email: user?.email, status: 'approved' }),
    enabled: !!user?.email,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LessonPlan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lesson-plans'] }),
  });

  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    setView('edit');
  };

  const handleGenerated = (plan) => {
    setSelectedPlan(plan);
    setView('edit');
    queryClient.invalidateQueries({ queryKey: ['lesson-plans'] });
  };

  const handleSaved = () => {
    setView('list');
    setSelectedPlan(null);
    queryClient.invalidateQueries({ queryKey: ['lesson-plans'] });
  };

  if (view === 'generate') {
    return (
      <LessonPlanSubscriptionGate
        user={user}
        planCount={allMyPlans.length}
        approvedPayments={approvedPayments}
      >
        <LessonPlanGenerator
          user={user}
          onGenerated={handleGenerated}
          onBack={() => setView('list')}
        />
      </LessonPlanSubscriptionGate>
    );
  }

  if (view === 'edit' && selectedPlan) {
    return (
      <LessonPlanEditor
        plan={selectedPlan}
        onSaved={handleSaved}
        onBack={() => { setView('list'); setSelectedPlan(null); }}
        user={user}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Lesson Plans
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">CBE-aligned lesson plans for all grades</p>
        </div>
        <Button onClick={() => setView('generate')} className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate New Plan
        </Button>
      </div>

      {/* Trial / subscription status */}
      <div className="flex gap-3 flex-wrap items-center">
        {approvedPayments.some(p => p.notes?.includes('lesson_plan')) ? (
          <Badge className="text-xs px-3 py-1.5 bg-green-600 text-white">Subscribed — Unlimited Plans</Badge>
        ) : allMyPlans.length < 2 ? (
          <Badge variant="outline" className="text-xs px-3 py-1.5 border-amber-400 bg-amber-50 text-amber-700">
            Free Trial: {allMyPlans.length}/2 plans used
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs px-3 py-1.5 border-destructive/50 bg-destructive/5 text-destructive">
            Free trial used — subscribe to generate more
          </Badge>
        )}
        <Badge variant="outline" className="text-xs px-3 py-1.5 border-primary/30 bg-primary/5 text-primary">
          KES 300/month · KES 1,000/term
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filterGrade} onValueChange={setFilterGrade}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTerm} onValueChange={setFilterTerm}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All Terms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Terms</SelectItem>
            {TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{plans.length} plan(s)</span>
      </div>

      {/* Plans list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center py-14 gap-4">
            <BookOpen className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-center">No lesson plans yet. Click "Generate New Plan" to create your first one.</p>
            <Button onClick={() => setView('generate')} variant="outline" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate a Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {plans.map(plan => (
            <Card key={plan.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-1.5">
                    <Badge variant="secondary" className="text-xs">{plan.grade}</Badge>
                    <Badge variant="outline" className="text-xs">{plan.term}</Badge>
                    <Badge variant="outline" className="text-xs">Wk {plan.week} · L{plan.lesson}</Badge>
                  </div>
                  <p className="font-semibold text-sm leading-tight truncate">{plan.title || `${plan.subject} — ${plan.strand || 'Lesson'}`}</p>
                  {plan.strand && <p className="text-xs text-muted-foreground mt-0.5 truncate">{plan.strand} · {plan.sub_strand}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowExport(plan)}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(plan)}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(plan.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* PDF Export Modal */}
      {showExport && (
        <LessonPlanPDFExport plan={showExport} onClose={() => setShowExport(null)} />
      )}
    </div>
  );
}