import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Download } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import LessonPlanPDFExport from './LessonPlanPDFExport';

const STEP_FRACTIONS = { v2_introduction: 0.125, v2_grapple: 0.125, v2_mini_lesson: 0.325, v2_guided_practice: 0.25, v2_work_time: 0.10, v2_debrief: 0.075 };

function getStepMins(duration) {
  const d = Number(duration) || 40;
  const s = {};
  let used = 0;
  const keys = Object.keys(STEP_FRACTIONS);
  keys.forEach((k, i) => {
    if (i === keys.length - 1) { s[k] = d - used; }
    else { s[k] = Math.round(d * STEP_FRACTIONS[k]); used += s[k]; }
  });
  return s;
}

function Field({ label, value, onChange, rows = 3 }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
      <textarea
        className="w-full text-sm border border-input rounded-md px-3 py-2 resize-y bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        rows={rows}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function ShortField({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
      <Input className="text-sm" value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

export default function LessonPlanEditorV2({ plan, onSaved, onBack }) {
  const [data, setData] = useState({ ...plan });
  const [showExport, setShowExport] = useState(false);

  const set = (key, val) => setData(d => ({ ...d, [key]: val }));
  const mins = getStepMins(data.duration);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.LessonPlan.update(data.id, data),
    onSuccess: () => {
      toast({ title: 'Lesson plan saved!' });
      onSaved();
    },
  });

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h2 className="text-lg font-bold">Edit V2 Lesson Plan</h2>
            <p className="text-xs text-muted-foreground">{data.grade} · {data.subject} · {data.term} · Wk {data.week} L{data.lesson}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowExport(true)}>
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Header */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Header Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ShortField label="School Name" value={data.school_name} onChange={v => set('school_name', v)} />
          <ShortField label="Teacher Name" value={data.teacher_name} onChange={v => set('teacher_name', v)} />
          <ShortField label="Lesson Duration (minutes)" value={String(data.duration || 40)} onChange={v => set('duration', Number(v))} />
          <ShortField label="Title" value={data.title} onChange={v => set('title', v)} />
        </CardContent>
      </Card>

      {/* Big Idea & Core sections */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Big Idea & Core Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ShortField label="Big Idea" value={data.big_idea} onChange={v => set('big_idea', v)} />
          <ShortField label="Strand" value={data.strand} onChange={v => set('strand', v)} />
          <ShortField label="Sub Strand" value={data.sub_strand} onChange={v => set('sub_strand', v)} />
          <Field label="Mission / Vision" value={data.mission_vision} onChange={v => set('mission_vision', v)} rows={2} />
          <Field label="Lesson Target (I can...)" value={data.lesson_target} onChange={v => set('lesson_target', v)} rows={2} />
          <Field label="Learning Resources" value={data.learning_resources} onChange={v => set('learning_resources', v)} rows={2} />
          <Field label="Core Competency" value={data.core_competency} onChange={v => set('core_competency', v)} rows={2} />
        </CardContent>
      </Card>

      {/* Lesson Steps */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Lesson Steps</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label={`Introduction (${mins.v2_introduction} min)`} value={data.v2_introduction} onChange={v => set('v2_introduction', v)} rows={4} />
          <Field label={`Grapple (${mins.v2_grapple} min)`} value={data.v2_grapple} onChange={v => set('v2_grapple', v)} rows={4} />
          <Field label={`Mini-Lesson (${mins.v2_mini_lesson} min)`} value={data.v2_mini_lesson} onChange={v => set('v2_mini_lesson', v)} rows={5} />
          <Field label={`Guided Practice (${mins.v2_guided_practice} min)`} value={data.v2_guided_practice} onChange={v => set('v2_guided_practice', v)} rows={5} />
          <Field label={`Work-Time (${mins.v2_work_time} min)`} value={data.v2_work_time} onChange={v => set('v2_work_time', v)} rows={4} />
          <Field label={`Debrief (${mins.v2_debrief} min)`} value={data.v2_debrief} onChange={v => set('v2_debrief', v)} rows={3} />
        </CardContent>
      </Card>

      {/* Reflection */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Reflection</CardTitle></CardHeader>
        <CardContent>
          <Field label="Teacher Reflection / Self-Remarks" value={data.reflection} onChange={v => set('reflection', v)} rows={4} />
        </CardContent>
      </Card>

      <Button className="w-full gap-2 h-11" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        <Save className="w-4 h-4" />
        {saveMutation.isPending ? 'Saving...' : 'Save Lesson Plan'}
      </Button>

      {showExport && <LessonPlanPDFExport plan={data} onClose={() => setShowExport(false)} />}
    </div>
  );
}