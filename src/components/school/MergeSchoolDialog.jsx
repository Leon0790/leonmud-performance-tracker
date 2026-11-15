import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Merge } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const ROWS = [
  ['TeacherProfile', 'Teachers'],
  ['StudentRegister', 'Learners in register'],
  ['Student', 'Marks records'],
  ['Attendance', 'Attendance'],
  ['SchoolClass', 'Classes'],
  ['Submission', 'Submissions'],
  ['LessonPlan', 'Lesson plans'],
  ['Payment', 'Payment transactions'],
  ['PlatformLicence', 'Subscriptions'],
  ['LessonPlanEntitlement', 'Lesson plan purchases'],
];

export default function MergeSchoolDialog({ open, school, schools, onOpenChange, onMerged }) {
  const [duplicateId, setDuplicateId] = useState('');
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setDuplicateId('');
      setStats({});
      setConfirmed(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !duplicateId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all(
      [school.id, duplicateId].map((id) => base44.functions.invoke('platformAccount', { action: 'schoolStats', school_id: id })),
    )
      .then(([mainRes, dupRes]) => {
        if (cancelled) return;
        setStats({ main: mainRes.data?.counts || {}, dup: dupRes.data?.counts || {} });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [open, duplicateId, school?.id]);

  const candidates = (schools || []).filter(
    (s) => s.id !== school?.id && s.subscription_status !== 'archived',
  );

  const merge = async () => {
    setSaving(true);
    try {
      const res = await base44.functions.invoke('platformAccount', {
        action: 'mergeSchools',
        main_id: school.id,
        duplicate_id: duplicateId,
        confirm: true,
      });
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      const movedLearners = (data.moved?.StudentRegister || 0) + (data.moved?.Student || 0);
      toast({
        title: 'Schools merged',
        description: `${movedLearners} learner records and ${data.moved?.TeacherProfile || 0} teachers moved into ${school.name}. The duplicate is archived.`,
      });
      onMerged?.(data);
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Merge failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const value = (which, key) => Number(stats?.[which]?.[key] || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Merge a duplicate school</DialogTitle>
          <DialogDescription>
            Records from the duplicate move into <span className="font-medium">{school?.name}</span>. Nothing is deleted, and
            existing marks in the main school are never overwritten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Duplicate school to merge in</Label>
            <Select value={duplicateId} onValueChange={setDuplicateId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a school" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {duplicateId && (
            <div className="rounded-lg border overflow-hidden">
              <div className="grid grid-cols-3 bg-muted/60 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <p className="p-2">Records</p>
                <p className="p-2 text-center">Keep ({school?.code})</p>
                <p className="p-2 text-center">Move in</p>
              </div>
              {loading ? (
                <p className="p-4 text-xs text-muted-foreground text-center">Counting records…</p>
              ) : (
                ROWS.map(([key, label]) => (
                  <div key={key} className="grid grid-cols-3 text-xs border-t">
                    <p className="p-2 text-muted-foreground">{label}</p>
                    <p className="p-2 text-center font-medium">{value('main', key)}</p>
                    <p className="p-2 text-center font-medium">{value('dup', key)}</p>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="rounded-md border border-amber-300 bg-amber-50 p-2.5">
            <p className="text-xs font-semibold text-amber-900 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> How conflicts are handled
            </p>
            <p className="text-[11px] text-amber-900 mt-1">
              A learner already present in the main school is never duplicated or overwritten — their duplicate record is left in
              the archived school so no marks are lost. The duplicate school is archived and can be restored.
            </p>
          </div>

          <label className="flex items-start gap-2 text-xs cursor-pointer">
            <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} className="mt-0.5" />
            <span>I understand these records will be transferred and the duplicate school archived.</span>
          </label>

          <Button className="w-full gap-2" onClick={merge} disabled={saving || !duplicateId || !confirmed}>
            <Merge className="w-4 h-4" />
            {saving ? 'Merging…' : 'Merge schools'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}