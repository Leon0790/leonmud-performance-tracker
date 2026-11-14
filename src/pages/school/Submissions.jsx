import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, Send, CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAccount } from '@/hooks/use-account';
import { GRADES, TERMS, EXAM_TYPES } from '@/utils/learningAreas';
import { format } from 'date-fns';

const STATUS_STYLES = {
  submitted: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  needs_changes: 'bg-red-100 text-red-800 border-red-200',
};

export default function SchoolSubmissions() {
  const { user, schoolId, schoolName, isHeadteacher, isSuperAdmin, loading } = useAccount();
  const queryClient = useQueryClient();
  const reviewer = isHeadteacher || isSuperAdmin;
  const [form, setForm] = useState({ grade: 'Grade 7', class_name: '', term: 'Term 1', exam_type: 'End Term' });
  const [saving, setSaving] = useState(false);
  const [comment, setComment] = useState({});

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['school-submissions', schoolId],
    queryFn: () => base44.entities.Submission.filter({ school_id: schoolId }, '-created_date', 200),
    enabled: !!schoolId,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['school-submissions', schoolId] });

  const submit = async () => {
    setSaving(true);
    try {
      const learners = await base44.entities.Student.count({
        school_id: schoolId,
        grade: form.grade,
        term: form.term,
        exam_type: form.exam_type,
      });
      const existing = submissions.find(
        (s) => s.teacher_email === user?.email && s.grade === form.grade && s.term === form.term && s.exam_type === form.exam_type
      );
      const payload = {
        school_id: schoolId,
        teacher_email: user?.email || '',
        teacher_name: user?.full_name || user?.email || '',
        grade: form.grade,
        class_name: form.class_name,
        term: form.term,
        exam_type: form.exam_type,
        learners_count: learners,
        status: 'submitted',
        submitted_date: new Date().toISOString(),
      };
      if (existing) {
        await base44.entities.Submission.update(existing.id, payload);
        toast({ title: 'Submission updated', description: 'Your headteacher will review it again.' });
      } else {
        await base44.entities.Submission.create(payload);
        toast({ title: 'Assessment record submitted' });
      }
      refresh();
    } catch (e) {
      toast({ title: 'Could not submit', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const review = async (submission, status) => {
    await base44.entities.Submission.update(submission.id, {
      status,
      headteacher_comment: comment[submission.id] || submission.headteacher_comment || '',
      reviewed_by: user?.email || '',
      reviewed_date: new Date().toISOString(),
    });
    toast({ title: status === 'approved' ? 'Approved' : 'Returned to teacher' });
    refresh();
  };

  const mine = submissions.filter((s) => s.teacher_email === user?.email);
  const list = reviewer ? submissions : mine;

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
          <ClipboardCheck className="w-6 h-6 text-primary" /> {reviewer ? 'Assessment reviews' : 'Submit assessments'}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {schoolName || 'Your school'} · {reviewer ? 'review and approve teachers’ completed marks' : 'send completed marks to your headteacher'}
        </p>
      </div>

      {!reviewer && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold">Submit a completed assessment record</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Grade</Label>
                <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Class</Label>
                <Input className="mt-1" placeholder="e.g. East" value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Term</Label>
                <Select value={form.term} onValueChange={(v) => setForm({ ...form, term: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Exam</Label>
                <Select value={form.exam_type} onValueChange={(v) => setForm({ ...form, exam_type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{EXAM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full gap-2" onClick={submit} disabled={saving}>
              <Send className="w-4 h-4" /> {saving ? 'Submitting…' : 'Submit to headteacher'}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-14 text-center text-muted-foreground">
            {reviewer ? 'Nothing submitted yet.' : 'You have not submitted any assessment records yet.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {list.map((submission) => (
            <Card key={submission.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-semibold text-sm">
                      {submission.grade} {submission.class_name ? `· ${submission.class_name}` : ''} · {submission.term} · {submission.exam_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {submission.teacher_name || submission.teacher_email} · {submission.learners_count || 0} learners
                      {submission.submitted_date ? ` · ${format(new Date(submission.submitted_date), 'd MMM yyyy, HH:mm')}` : ''}
                    </p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border ${STATUS_STYLES[submission.status] || STATUS_STYLES.submitted}`}>
                    {(submission.status || 'submitted').replace('_', ' ')}
                  </span>
                </div>

                {submission.headteacher_comment && (
                  <p className="text-xs bg-muted/60 rounded-lg p-2.5 text-muted-foreground">
                    <strong>Headteacher:</strong> {submission.headteacher_comment}
                  </p>
                )}

                {reviewer && submission.status !== 'approved' && (
                  <div className="space-y-2 pt-1">
                    <Input
                      placeholder="Optional comment for the teacher"
                      value={comment[submission.id] ?? submission.headteacher_comment ?? ''}
                      onChange={(e) => setComment({ ...comment, [submission.id]: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="gap-1.5" onClick={() => review(submission, 'approved')}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => review(submission, 'needs_changes')}>
                        <RotateCcw className="w-3.5 h-3.5" /> Request changes
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}