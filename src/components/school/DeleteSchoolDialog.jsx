import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Archive, RotateCcw, Trash2, ShieldAlert } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const ROWS = [
  ['TeacherProfile', 'Teachers'],
  ['StudentRegister', 'Learners'],
  ['SchoolClass', 'Classes'],
  ['Student', 'Marks records'],
  ['Attendance', 'Attendance'],
  ['Submission', 'Submissions'],
  ['Payment', 'Payment transactions'],
  ['PlatformLicence', 'Subscriptions'],
  ['LessonPlanEntitlement', 'Lesson plan purchases'],
];

export default function DeleteSchoolDialog({ open, school, onOpenChange, onChanged }) {
  const [stats, setStats] = useState(null);
  const [reason, setReason] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !school?.id) return;
    setStats(null);
    setCode('');
    setReason('');
    base44.functions
      .invoke('platformAccount', { action: 'schoolStats', school_id: school.id })
      .then((res) => setStats(res.data || {}))
      .catch(() => setStats({ counts: {}, total: 0 }));
  }, [open, school?.id]);

  const run = async (action, payload) => {
    setSaving(true);
    try {
      const res = await base44.functions.invoke('platformAccount', { action, school_id: school.id, ...payload });
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      if (data.blocked) {
        toast({ title: 'Deletion blocked', description: data.message, variant: 'destructive' });
        return;
      }
      toast({
        title: action === 'deleteSchool' ? 'School deleted' : action === 'archiveSchool' ? 'School archived' : 'School restored',
        description: school.name,
      });
      onChanged?.();
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Action failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const total = Number(stats?.total || 0);
  const archived = school?.subscription_status === 'archived';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{archived ? 'Archived school' : 'Archive or delete school'}</DialogTitle>
          <DialogDescription>
            {school?.name} · <span className="font-mono">{school?.code}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Headteacher</p>
            <p className="text-sm font-medium">{school?.headteacher_name || '—'}</p>
            <p className="text-xs text-muted-foreground">{school?.headteacher_email || 'No email on record'}</p>
          </div>

          <div className="rounded-lg border overflow-hidden">
            {stats === null ? (
              <p className="p-4 text-xs text-center text-muted-foreground">Checking related records…</p>
            ) : (
              <>
                {ROWS.map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between px-3 py-1.5 text-xs border-b last:border-b-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{Number(stats?.counts?.[key] || 0)}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Reason (recorded in the audit log)</Label>
            <Input className="mt-1" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. accidental duplicate registration" />
          </div>

          {archived ? (
            <Button className="w-full gap-2" onClick={() => run('restoreSchool', {})} disabled={saving}>
              <RotateCcw className="w-4 h-4" /> {saving ? 'Restoring…' : 'Restore school'}
            </Button>
          ) : (
            <Button variant="outline" className="w-full gap-2" onClick={() => run('archiveSchool', { confirm: true, reason })} disabled={saving}>
              <Archive className="w-4 h-4" /> Archive and keep all records
            </Button>
          )}

          {total > 0 ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2.5">
              <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Permanent deletion blocked
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                This school still holds {total} records. Merge them into the main school, or archive the school, before deleting.
                Learners, marks, reports and payments are never deleted automatically.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2.5 space-y-2">
              <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Delete permanently
              </p>
              <p className="text-[11px] text-muted-foreground">
                This school has no records. Type the school code <span className="font-mono font-semibold">{school?.code}</span> to confirm.
              </p>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="School code" />
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => run('deleteSchool', { confirm_code: code, reason })}
                disabled={saving || code.trim().toLowerCase() !== String(school?.code || '').trim().toLowerCase()}
              >
                {saving ? 'Deleting…' : 'Delete school permanently'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}