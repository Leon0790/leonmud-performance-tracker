import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { School, Plus, Users, GraduationCap, Wallet, BookOpen, CheckCircle2, PauseCircle, UserCog, MapPin } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAccount } from '@/hooks/use-account';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
  expired: 'bg-muted text-muted-foreground',
};

const emptyForm = {
  name: '', code: '', county: '', sub_county: '', email: '',
  headteacher_name: '', headteacher_email: '', contact_number: '',
};

export default function SuperAdminSchools() {
  const { user } = useAccount();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [assignFor, setAssignFor] = useState(null);
  const [assign, setAssign] = useState({ headteacher_name: '', headteacher_email: '' });
  const [linkFor, setLinkFor] = useState(null);
  const [link, setLink] = useState({ email: '', user_type: 'teacher' });

  const { data: schools = [], isLoading } = useQuery({
    queryKey: ['all-schools'],
    queryFn: () => base44.entities.School.list('-created_date', 200),
  });

  const { data: teacherRows = [] } = useQuery({
    queryKey: ['platform-teacher-counts'],
    queryFn: async () => {
      const res = await base44.entities.TeacherProfile.aggregate({ query: {}, groupBy: 'school_id' });
      return res.rows || [];
    },
  });

  const { data: learnerRows = [] } = useQuery({
    queryKey: ['platform-learner-counts'],
    queryFn: async () => {
      const res = await base44.entities.StudentRegister.aggregate({ query: {}, groupBy: 'school_id' });
      return res.rows || [];
    },
  });

  const { data: revenueRows = [] } = useQuery({
    queryKey: ['platform-revenue'],
    queryFn: async () => {
      const res = await base44.entities.Payment.aggregate({
        query: { status: 'approved' },
        groupBy: 'category',
        sum: ['amount'],
      });
      return res.rows || [];
    },
  });

  const countFor = (rows, id) => rows.find((r) => r.school_id === id)?.count || 0;
  const revenue = (category) => revenueRows.find((r) => r.category === category)?.sum_amount || 0;
  const totalLearners = learnerRows.reduce((s, r) => s + (r.count || 0), 0);
  const totalTeachers = teacherRows.reduce((s, r) => s + (r.count || 0), 0);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['all-schools'] });
    queryClient.invalidateQueries({ queryKey: ['platform-teacher-counts'] });
    queryClient.invalidateQueries({ queryKey: ['platform-learner-counts'] });
  };

  const registerSchool = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast({ title: 'School name and code are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const created = await base44.entities.School.create({
        ...form,
        date_registered: new Date().toISOString().slice(0, 10),
        subscription_status: 'pending',
      });
      await base44.entities.School.update(created.id, { school_id: created.id });
      if (form.headteacher_email) {
        await base44.entities.SchoolInvite.create({
          school_id: created.id,
          school_name: form.name,
          email: form.headteacher_email,
          user_type: 'headteacher',
          status: 'pending',
          invited_by_email: user?.email || '',
        });
        await base44.functions.invoke('platformAccount', {
          action: 'assignSchool',
          email: form.headteacher_email,
          school_id: created.id,
          user_type: 'headteacher',
        }).catch(() => null);
      }
      toast({ title: 'School registered', description: `${form.name} is ready.` });
      setForm(emptyForm);
      setShowForm(false);
      refresh();
    } catch (e) {
      toast({ title: 'Could not register school', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (school, status) => {
    await base44.entities.School.update(school.id, { subscription_status: status });
    toast({ title: `School ${status}` });
    refresh();
  };

  const saveHeadteacher = async () => {
    if (!assign.headteacher_email.trim()) return;
    setSaving(true);
    try {
      const schoolId = assignFor.school_id || assignFor.id;
      await base44.entities.School.update(assignFor.id, {
        headteacher_name: assign.headteacher_name,
        headteacher_email: assign.headteacher_email,
      });
      await base44.entities.SchoolInvite.create({
        school_id: schoolId,
        school_name: assignFor.name,
        email: assign.headteacher_email,
        user_type: 'headteacher',
        status: 'pending',
        invited_by_email: user?.email || '',
      });
      await base44.functions.invoke('platformAccount', {
        action: 'assignSchool',
        email: assign.headteacher_email,
        school_id: schoolId,
        user_type: 'headteacher',
      }).catch(() => null);
      toast({ title: 'Headteacher assigned', description: 'They join the school as soon as they sign in.' });
      setAssignFor(null);
      setAssign({ headteacher_name: '', headteacher_email: '' });
      refresh();
    } catch (e) {
      toast({ title: 'Could not assign headteacher', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const linkUser = async () => {
    if (!link.email.trim()) return;
    setSaving(true);
    try {
      const res = await base44.functions.invoke('platformAccount', {
        action: 'assignSchool',
        email: link.email.trim().toLowerCase(),
        school_id: linkFor.school_id || linkFor.id,
        user_type: link.user_type,
      });
      if (res.data?.error) throw new Error(res.data.error);
      toast({ title: 'User linked', description: `${link.email} now belongs to ${linkFor.name}.` });
      setLinkFor(null);
      setLink({ email: '', user_type: 'teacher' });
      refresh();
    } catch (e) {
      toast({ title: 'Could not link user', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <School className="w-6 h-6 text-primary" /> Schools
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Register schools, assign headteachers, monitor subscriptions</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Register school
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Schools', value: schools.length, icon: School },
          { label: 'Teachers', value: totalTeachers, icon: Users },
          { label: 'Learners', value: totalLearners, icon: GraduationCap },
          { label: 'Lesson plan revenue', value: `KSh ${Number(revenue('lesson_plan') || 0).toLocaleString()}`, icon: BookOpen },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <s.icon className="w-4 h-4" /> {s.label}
              </div>
              <p className="text-xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Platform subscriptions collected</span>
          </div>
          <p className="text-lg font-bold">KSh {Number(revenue('platform_subscription') || 0).toLocaleString()}</p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : schools.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-14 text-center text-muted-foreground">
            No schools yet. Register the first school to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {schools.map((school) => (
            <Card key={school.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{school.name}</p>
                      <Badge variant="outline" className="font-mono text-[11px]">{school.code}</Badge>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${STATUS_STYLES[school.subscription_status] || STATUS_STYLES.pending}`}>
                        {school.subscription_status || 'pending'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {[school.sub_county, school.county].filter(Boolean).join(', ') || 'Location not set'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Headteacher: {school.headteacher_name || '—'} {school.headteacher_email ? `· ${school.headteacher_email}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{countFor(teacherRows, school.school_id || school.id)} teachers</p>
                    <p className="text-xs text-muted-foreground">{countFor(learnerRows, school.school_id || school.id)} learners</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {school.subscription_status !== 'active' && (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setStatus(school, 'active')}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve / activate
                    </Button>
                  )}
                  {school.subscription_status === 'active' && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-destructive" onClick={() => setStatus(school, 'suspended')}>
                      <PauseCircle className="w-3.5 h-3.5" /> Suspend
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5"
                    onClick={() => {
                      setAssign({ headteacher_name: school.headteacher_name || '', headteacher_email: school.headteacher_email || '' });
                      setAssignFor(school);
                    }}
                  >
                    <UserCog className="w-3.5 h-3.5" /> Assign headteacher
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5"
                    onClick={() => {
                      setLink({ email: '', user_type: 'teacher' });
                      setLinkFor(school);
                    }}
                  >
                    <Users className="w-3.5 h-3.5" /> Link user
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg w-full max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register a school</DialogTitle>
            <DialogDescription>The headteacher is invited by email and takes control of the school workspace.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ['name', 'School name *'], ['code', 'School code *'], ['county', 'County'], ['sub_county', 'Sub-county'],
              ['email', 'School email'], ['contact_number', 'Contact number'],
              ['headteacher_name', 'Headteacher name'], ['headteacher_email', 'Headteacher email'],
            ].map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Input className="mt-1" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
          </div>
          <Button className="w-full mt-2" onClick={registerSchool} disabled={saving}>
            {saving ? 'Registering…' : 'Register school'}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!linkFor} onOpenChange={(v) => !v && setLinkFor(null)}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Link a user to this school</DialogTitle>
            <DialogDescription>
              Moves an existing teacher or headteacher — and all their learners and marks — into {linkFor?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Email they sign in with</Label>
              <Input className="mt-1" value={link.email} onChange={(e) => setLink({ ...link, email: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Role</Label>
              <div className="flex gap-2 mt-1">
                <Button size="sm" variant={link.user_type === 'teacher' ? 'default' : 'outline'} onClick={() => setLink({ ...link, user_type: 'teacher' })}>
                  Teacher
                </Button>
                <Button size="sm" variant={link.user_type === 'headteacher' ? 'default' : 'outline'} onClick={() => setLink({ ...link, user_type: 'headteacher' })}>
                  Headteacher
                </Button>
              </div>
            </div>
            <Button className="w-full" onClick={linkUser} disabled={saving || !link.email}>
              {saving ? 'Linking…' : 'Link user'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignFor} onOpenChange={(v) => !v && setAssignFor(null)}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Assign headteacher</DialogTitle>
            <DialogDescription>For {assignFor?.name}. Use the email they sign in with.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Full name</Label>
              <Input className="mt-1" value={assign.headteacher_name} onChange={(e) => setAssign({ ...assign, headteacher_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input className="mt-1" value={assign.headteacher_email} onChange={(e) => setAssign({ ...assign, headteacher_email: e.target.value })} />
            </div>
            <Button className="w-full" onClick={saveHeadteacher} disabled={saving || !assign.headteacher_email}>
              {saving ? 'Saving…' : 'Assign headteacher'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}