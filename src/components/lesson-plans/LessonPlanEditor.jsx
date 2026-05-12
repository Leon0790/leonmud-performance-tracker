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

export default function LessonPlanEditor({ plan, onSaved, onBack, user }) {
  const [data, setData] = useState({ ...plan });
  const [showExport, setShowExport] = useState(false);

  const set = (key, val) => setData(d => ({ ...d, [key]: val }));

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
            <h2 className="text-lg font-bold">Edit Lesson Plan</h2>
            <p className="text-xs text-muted-foreground">{data.grade} · {data.subject} · {data.term} · Wk {data.week} L{data.lesson}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowExport(true)}>
            <Download className="w-4 h-4" /> PDF
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Header info */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Header Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ShortField label="Title" value={data.title} onChange={v => set('title', v)} />
          <ShortField label="School Name" value={data.school_name} onChange={v => set('school_name', v)} />
          <ShortField label="Strand" value={data.strand} onChange={v => set('strand', v)} />
          <ShortField label="Sub Strand" value={data.sub_strand} onChange={v => set('sub_strand', v)} />
        </CardContent>
      </Card>

      {/* Learning outcomes */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Learning Outcomes & Inquiry</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Specific Learning Outcomes" value={data.specific_outcomes} onChange={v => set('specific_outcomes', v)} rows={5} />
          <Field label="Key Inquiry Question" value={data.key_inquiry_question} onChange={v => set('key_inquiry_question', v)} rows={2} />
          <Field label="Learning Resources" value={data.learning_resources} onChange={v => set('learning_resources', v)} rows={2} />
          <Field label="Organisation of Learning" value={data.organization_of_learning} onChange={v => set('organization_of_learning', v)} rows={2} />
        </CardContent>
      </Card>

      {/* Lesson flow */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Lesson Flow (Time / Content Table)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Introduction (5 minutes)" value={data.introduction} onChange={v => set('introduction', v)} rows={3} />
          <Field label="Lesson Development — Steps 1, 2, 3 (20 minutes)" value={data.lesson_development} onChange={v => set('lesson_development', v)} rows={8} />
          <Field label="Extended Activities (homework / digital)" value={data.extended_activities} onChange={v => set('extended_activities', v)} rows={3} />
          <Field label="Conclusion (5 minutes)" value={data.conclusion} onChange={v => set('conclusion', v)} rows={3} />
        </CardContent>
      </Card>

      {/* Teacher resources */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Teacher's Own Resources & Reflection</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Additional Teaching Resources (add your own notes, links, materials)" value={data.reflection} onChange={v => set('reflection', v)} rows={5} />
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