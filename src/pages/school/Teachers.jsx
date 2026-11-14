import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Users, UserPlus, Pencil, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAccount } from '@/hooks/use-account';
import ChipSelect from '@/components/school/ChipSelect';
import { GRADES, LEARNING_AREAS } from '@/utils/learningAreas';

const emptyMember = { teacher_name: '', teacher_email: '', grades: [], learning_areas: [] };

export default function SchoolTeachers() {
  const { user, schoolId, schoolName, loading } = useAccount();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [member, setMember] = useState(emptyMember);
  const [saving, setSaving] = useState(false);

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['school-teachers', schoolId],
    queryFn: () => base44.entities.TeacherProfile.filter({ school_id: schoolId }, 'teacher_name', 200),
    enabled: !!schoolId,
  });

  const { data: inviteRecords = [] } = useQuery({
    queryKey: ['school-invites', schoolId],
    queryFn: () => base44.entities.SchoolInvite.filter({ school_id: schoolId }, '-created_date', 100),
    enabled: !!schoolId,
  });

  const { data: marksRows = [] } = useQuery({
    queryKey: ['school-marks-by-teacher', schoolId],
    queryFn: async () => {
      const res = await base44.entities.Student.aggregate({ query: { school_id: schoolId }, groupBy: 'teacher_email' });
      return res.rows || [];
    },
    enabled: !!schoolId,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['school-submissions', schoolId],
    queryFn: () => base44.entities.Submission.filter({ school_id: schoolId }, '-created_date', 200),
    enabled: !!schoolId,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['school-teachers', schoolId] });
    queryClient.invalidateQueries({ queryKey: ['school-invites', schoolId] });
  };

  const openNew = () => {
    setMember(emptyMember);
    setEditing('new');
  };

  const openEdit = (teacher) => {
    setMember({
      teacher_name: teacher.teacher_name || '',
      teacher_email: teacher.teacher_email,
      grades: teacher.grades || [],
      learning_areas: teacher.learning_areas || [],
    });
    setEditing(teacher);
  };

  const save = async () => {
    if (!member.teacher_email.trim()) {
      toast({ title: 'Teacher email is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        school_id: schoolId,
        school_name: schoolName,
        teacher_email: member.teacher_email.trim().toLowerCase(),
        teacher_name: member.teacher_name.trim() || member.teacher_email.trim(),
        grades: member.grades,
        learning_areas: member.learning_areas,
        status: 'active',
      };
      if (editing === 'new') {
        await base44.entities.TeacherProfile.create(payload);
        await base44.entities.SchoolInvite.create({
          school_id: schoolId,
          school_name: schoolName,
          email: payload.teacher_email,
          user_type: 'teacher',
          grades: member.grades,
          learning_areas: member.learning_areas,
          status: 'pending',
          invited_by_email: user?.email || '',
        });
        const res = await base44.functions.invoke('platformAccount', {
          action: 'inviteMember',
          email: payload.teacher_email,
          school_id: schoolId,
          user_type: 'teacher',
        }).catch(() => null);
        const note = res?.data?.invited ? 'Invitation email sent.' : 'They join the school the first time they sign in.';
        toast({ title: 'Teacher added', description: note });
      } else {
        await base44.entities.TeacherProfile.update(editing.id, payload);
        toast({ title: 'Teacher updated' });
      }
      setEditing(null);
      setMember(emptyMember);
      refresh();
    } catch (e) {
      toast({ title: 'Could not save teacher', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (teacher, status) => {
    await base44.entities.TeacherProfile.update(teacher.id, { status });
    refresh();
  };

  const marksCount = (email) => marksRows.find((r) => r.teacher_email === email)?.count || 0;
  const latestSubmission = (email) => submissions.find((s) => s.teacher_email === email);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center py-20 space-y-2">
        <Users className="w-10 h-10 text-muted-foreground mx-auto" />
        <h2 className="text-lg font-bold">No school linked yet</h2>
        <p className="text-sm text-muted-foreground">Ask the platform administrator to link your account to a school.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Teachers
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{schoolName || 'Your school'} · assign grades and learning areas</p>
        </div>
        <Button className="gap-2" onClick={openNew}>
          <UserPlus className="w-4 h-4" /> Invite teacher
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : teachers.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-14 text-center text-muted-foreground">
            No teachers yet. Invite your first teacher by email.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {teachers.map((teacher) => {
            const submission = latestSubmission(teacher.teacher_email);
            return (
              <Card key={teacher.id}>
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{teacher.teacher_name || teacher.teacher_email}</p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {teacher.teacher_email}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[11px] shrink-0">{teacher.status || 'invited'}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {(teacher.grades || []).map((g) => (
                      <span key={g} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{g}</span>
                    ))}
                    {(teacher.learning_areas || []).map((a) => (
                      <span key={a} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{a}</span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                    <span>{marksCount(teacher.teacher_email)} learner marks</span>
                    {submission ? (
                      <span className="flex items-center gap-1 text-green-700">
                        <CheckCircle2 className="w-3 h-3" /> {submission.status.replace('_', ' ')} · {submission.grade} {submission.term}
                      </span>
                    ) : (
                      <span className="text-amber-700">Marks not yet submitted</span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEdit(teacher)}>
                      <Pencil className="w-3.5 h-3.5" /> Assign
                    </Button>
                    {teacher.status === 'active' ? (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setStatus(teacher, 'inactive')}>
                        Deactivate
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setStatus(teacher, 'active')}>
                        Activate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {inviteRecords.filter((i) => i.status === 'pending' && i.user_type === 'teacher').length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pending invitations</p>
            {inviteRecords.filter((i) => i.status === 'pending' && i.user_type === 'teacher').map((invite) => (
              <p key={invite.id} className="text-xs text-muted-foreground">{invite.email} — joins automatically when they sign in</p>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg w-full max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Invite a teacher' : 'Assign teacher'}</DialogTitle>
            <DialogDescription>Teachers only see learners, marks and lesson plans for their own school.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Full name</Label>
              <Input className="mt-1" value={member.teacher_name} onChange={(e) => setMember({ ...member, teacher_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email they sign in with</Label>
              <Input
                className="mt-1"
                value={member.teacher_email}
                disabled={editing !== 'new'}
                onChange={(e) => setMember({ ...member, teacher_email: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Grades</Label>
              <div className="mt-1">
                <ChipSelect options={GRADES} value={member.grades} onChange={(grades) => setMember({ ...member, grades })} columns={3} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Learning areas</Label>
              <div className="mt-1">
                <ChipSelect options={LEARNING_AREAS} value={member.learning_areas} onChange={(learning_areas) => setMember({ ...member, learning_areas })} />
              </div>
            </div>
            <Button className="w-full" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editing === 'new' ? 'Invite teacher' : 'Save assignments'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}