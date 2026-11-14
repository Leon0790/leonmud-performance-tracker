import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Layers, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAccount } from '@/hooks/use-account';
import ChipSelect from '@/components/school/ChipSelect';
import { GRADES, LEARNING_AREAS } from '@/utils/learningAreas';

const emptyClass = { name: '', grade: 'Grade 7', stream: '', class_teacher_email: '', learning_areas: [] };

export default function SchoolClasses() {
  const { schoolId, schoolName, loading } = useAccount();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyClass);
  const [saving, setSaving] = useState(false);

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['school-classes', schoolId],
    queryFn: () => base44.entities.SchoolClass.filter({ school_id: schoolId }, 'name', 200),
    enabled: !!schoolId,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['school-teachers', schoolId],
    queryFn: () => base44.entities.TeacherProfile.filter({ school_id: schoolId }, 'teacher_name', 200),
    enabled: !!schoolId,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['school-classes', schoolId] });

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Class name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, school_id: schoolId, name: form.name.trim() };
      if (editing === 'new') {
        await base44.entities.SchoolClass.create(payload);
        toast({ title: 'Class created' });
      } else {
        await base44.entities.SchoolClass.update(editing.id, payload);
        toast({ title: 'Class updated' });
      }
      setEditing(null);
      setForm(emptyClass);
      refresh();
    } catch (e) {
      toast({ title: 'Could not save class', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (cls) => {
    await base44.entities.SchoolClass.delete(cls.id);
    toast({ title: 'Class removed' });
    refresh();
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
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" /> Classes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{schoolName || 'Your school'} · class list and class teachers</p>
        </div>
        <Button className="gap-2" onClick={() => { setForm(emptyClass); setEditing('new'); }}>
          <Plus className="w-4 h-4" /> New class
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : classes.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-14 text-center text-muted-foreground">No classes yet. Create the first class.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {classes.map((cls) => (
            <Card key={cls.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{cls.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cls.grade}{cls.stream ? ` · ${cls.stream}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setForm({ ...emptyClass, ...cls }); setEditing(cls); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(cls)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Class teacher: {teachers.find((t) => t.teacher_email === cls.class_teacher_email)?.teacher_name || cls.class_teacher_email || '—'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {(cls.learning_areas || []).map((a) => (
                    <span key={a} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{a}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg w-full max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'New class' : 'Edit class'}</DialogTitle>
            <DialogDescription>Classes group your learners under a class teacher.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Class name</Label>
              <Input className="mt-1" placeholder="e.g. Grade 7 East" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Grade</Label>
                <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Stream</Label>
                <Input className="mt-1" placeholder="East" value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Class teacher</Label>
              <Select value={form.class_teacher_email || 'none'} onValueChange={(v) => setForm({ ...form, class_teacher_email: v === 'none' ? '' : v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a teacher" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not assigned</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.teacher_email} value={t.teacher_email}>{t.teacher_name || t.teacher_email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Learning areas taught</Label>
              <div className="mt-1">
                <ChipSelect options={LEARNING_AREAS} value={form.learning_areas || []} onChange={(learning_areas) => setForm({ ...form, learning_areas })} />
              </div>
            </div>
            <Button className="w-full" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save class'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}