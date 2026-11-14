import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { getBand, bandTailwindColor } from '@/utils/bands';
import { PAPER_SUBJECTS, SIMPLE_SUBJECTS, MARK_SUBJECT_COUNT, calcPaperTotal } from '@/utils/markSubjects';

/**
 * Edits the paper marks (P1 out of 50, P2 out of 30, …) of one student and saves
 * them straight to the student record. Pass `student` to edit a fixed learner, or
 * `students` to let the teacher pick one.
 */
export default function PaperMarksEditor({ open, onOpenChange, student, students = [], onSaved }) {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState('');
  const [values, setValues] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const list = student ? [student] : students;
  const current = student || list.find(s => s.id === selectedId) || null;

  useEffect(() => {
    if (!open) return;
    setSelectedId(student?.id || students[0]?.id || '');
  }, [open, student?.id, students]);

  useEffect(() => {
    if (!open || !current) return;
    const init = {};
    PAPER_SUBJECTS.forEach(({ papers }) => {
      papers.forEach(({ pkey }) => { init[pkey] = current[pkey] ?? ''; });
    });
    setValues(init);
  }, [open, current?.id]);

  const handleSave = async () => {
    if (!current) return;
    setIsSaving(true);
    const data = {};
    let paperTotal = 0;
    PAPER_SUBJECTS.forEach(({ key, papers }) => {
      papers.forEach(({ pkey }) => {
        data[pkey] = values[pkey] === '' || values[pkey] === undefined ? null : parseInt(values[pkey]) || 0;
      });
      const total = calcPaperTotal(values, { papers });
      data[key] = total;
      data[`${key}_band`] = getBand(total);
      paperTotal += total;
    });
    const simpleTotal = SIMPLE_SUBJECTS.reduce((sum, s) => sum + (Number(current[s.key]) || 0), 0);
    data.overall_band = getBand((paperTotal + simpleTotal) / MARK_SUBJECT_COUNT);

    await base44.entities.Student.update(current.id, data);
    setIsSaving(false);
    onSaved?.(data, current.id);
    toast({ title: 'Paper marks saved' });
    onOpenChange(false);
  };

  const setValue = (pkey, max, raw) => {
    const clean = raw === '' ? '' : Math.min(max, Math.max(0, parseInt(raw) || 0));
    setValues(v => ({ ...v, [pkey]: clean }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Paper Marks</DialogTitle>
        </DialogHeader>

        {!student && (
          <div>
            <Label className="text-xs text-muted-foreground">Student</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {current ? (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {PAPER_SUBJECTS.map(subject => {
              const total = calcPaperTotal(values, subject);
              const band = getBand(total);
              return (
                <div key={subject.key} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">{subject.label}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-primary">Total {total || 0}</span>
                      {band && <span className={`px-1.5 py-0.5 rounded font-bold ${bandTailwindColor(band)}`}>{band}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {subject.papers.map(p => (
                      <div key={p.pkey}>
                        <Label className="text-xs text-muted-foreground">{p.label} (out of {p.max})</Label>
                        <Input
                          type="number"
                          min="0"
                          max={p.max}
                          value={values[p.pkey] ?? ''}
                          onChange={e => setValue(p.pkey, p.max, e.target.value)}
                          className="mt-1 h-9 w-24 text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">No student selected.</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!current || isSaving}>
            {isSaving ? 'Saving...' : 'Save Marks'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}