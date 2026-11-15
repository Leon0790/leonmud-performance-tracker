import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  School as SchoolIcon, Plus, Users, GraduationCap, Wallet, BookOpen, CreditCard, Search, History,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import SchoolCard from '@/components/school/SchoolCard';
import RegisterSchoolDialog from '@/components/school/RegisterSchoolDialog';
import InviteHeadteacherDialog from '@/components/school/InviteHeadteacherDialog';
import LinkAccountDialog from '@/components/school/LinkAccountDialog';
import MergeSchoolDialog from '@/components/school/MergeSchoolDialog';
import DeleteSchoolDialog from '@/components/school/DeleteSchoolDialog';

export default function SuperAdminSchools() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [inviteFor, setInviteFor] = useState(null);
  const [linkFor, setLinkFor] = useState(null);
  const [mergeFor, setMergeFor] = useState(null);
  const [manageFor, setManageFor] = useState(null);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const { data: schools = [], isLoading } = useQuery({
    queryKey: ['all-schools'],
    queryFn: () => base44.entities.School.list('-created_date', 200),
  });

  const { data: teacherRows = [] } = useQuery({
    queryKey: ['platform-teacher-counts'],
    queryFn: async () => (await base44.entities.TeacherProfile.aggregate({ query: {}, groupBy: 'school_id' })).rows || [],
  });

  const { data: learnerRows = [] } = useQuery({
    queryKey: ['platform-learner-counts'],
    queryFn: async () => (await base44.entities.StudentRegister.aggregate({ query: {}, groupBy: 'school_id' })).rows || [],
  });

  const { data: revenueRows = [] } = useQuery({
    queryKey: ['platform-revenue'],
    queryFn: async () => {
      const res = await base44.entities.Payment.aggregate({
        query: { status: 'approved' }, groupBy: 'category', sum: ['amount'],
      });
      return res.rows || [];
    },
  });

  const { data: activeLicences = 0 } = useQuery({
    queryKey: ['platform-active-licences'],
    queryFn: () => base44.entities.PlatformLicence.count({ status: 'active' }),
  });

  const { data: auditRows = [] } = useQuery({
    queryKey: ['platform-audit'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 8),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['all-schools'] });
    queryClient.invalidateQueries({ queryKey: ['platform-teacher-counts'] });
    queryClient.invalidateQueries({ queryKey: ['platform-learner-counts'] });
    queryClient.invalidateQueries({ queryKey: ['platform-active-licences'] });
    queryClient.invalidateQueries({ queryKey: ['platform-audit'] });
  };

  const countFor = (rows, id) => rows.find((r) => r.school_id === id)?.count || 0;
  const revenue = (category) => Number(revenueRows.find((r) => r.category === category)?.sum_amount || 0);

  const live = schools.filter((s) => s.subscription_status !== 'archived');
  const archivedCount = schools.length - live.length;
  const byStatus = (status) => live.filter((s) => (s.subscription_status || 'pending') === status).length;
  const totalTeachers = teacherRows.reduce((sum, r) => sum + (r.count || 0), 0);
  const totalLearners = learnerRows.reduce((sum, r) => sum + (r.count || 0), 0);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return schools
      .filter((s) => (showArchived ? true : s.subscription_status !== 'archived'))
      .filter((s) => !term
        || String(s.name || '').toLowerCase().includes(term)
        || String(s.code || '').toLowerCase().includes(term)
        || String(s.headteacher_email || '').toLowerCase().includes(term));
  }, [schools, search, showArchived]);

  const setStatus = async (school, status) => {
    await base44.entities.School.update(school.id, { subscription_status: status });
    toast({ title: status === 'active' ? 'School activated' : `School ${status}`, description: school.name });
    refresh();
  };

  const stats = [
    { label: 'Schools', value: live.length, icon: SchoolIcon },
    { label: 'Active', value: byStatus('active'), icon: SchoolIcon },
    { label: 'Pending', value: byStatus('pending'), icon: SchoolIcon },
    { label: 'Suspended', value: byStatus('suspended'), icon: SchoolIcon },
    { label: 'Teachers', value: totalTeachers, icon: Users },
    { label: 'Learners', value: totalLearners, icon: GraduationCap },
    { label: 'Active subscriptions', value: activeLicences || 0, icon: CreditCard },
    { label: 'Platform revenue', value: `KSh ${revenue('platform_subscription').toLocaleString()}`, icon: Wallet },
    { label: 'Lesson-plan revenue', value: `KSh ${revenue('lesson_plan').toLocaleString()}`, icon: BookOpen },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SchoolIcon className="w-6 h-6 text-primary" /> Schools
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Register schools, invite headteachers, merge duplicates
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Register new school
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
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

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search school, code or headteacher" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {archivedCount > 0 && (
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <Checkbox checked={showArchived} onCheckedChange={(v) => setShowArchived(!!v)} />
            Show archived ({archivedCount})
          </label>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-14 text-center text-muted-foreground">
            No schools match. Register the school to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {visible.map((school) => (
            <SchoolCard
              key={school.id}
              school={school}
              teacherCount={countFor(teacherRows, school.school_id || school.id)}
              learnerCount={countFor(learnerRows, school.school_id || school.id)}
              onInvite={setInviteFor}
              onStatus={setStatus}
              onLink={setLinkFor}
              onMerge={setMergeFor}
              onManage={setManageFor}
            />
          ))}
        </div>
      )}

      {auditRows.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Recent administrator activity
            </p>
            {auditRows.map((entry) => (
              <p key={entry.id} className="text-xs text-muted-foreground">
                <span className="text-foreground font-medium">{(entry.action || '').replace(/_/g, ' ')}</span>
                {' · '}{entry.school_name || entry.target || '—'}
                {' · '}{entry.actor_email}
                {' · '}{new Date(entry.created_date).toLocaleDateString()}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <RegisterSchoolDialog open={showForm} onOpenChange={setShowForm} onRegistered={refresh} />
      <InviteHeadteacherDialog
        open={!!inviteFor}
        school={inviteFor}
        onOpenChange={(v) => !v && setInviteFor(null)}
        onDone={refresh}
      />
      <LinkAccountDialog
        open={!!linkFor}
        school={linkFor}
        onOpenChange={(v) => !v && setLinkFor(null)}
        onLinked={refresh}
      />
      <MergeSchoolDialog
        open={!!mergeFor}
        school={mergeFor}
        schools={schools}
        onOpenChange={(v) => !v && setMergeFor(null)}
        onMerged={refresh}
      />
      <DeleteSchoolDialog
        open={!!manageFor}
        school={manageFor}
        onOpenChange={(v) => !v && setManageFor(null)}
        onChanged={refresh}
      />
    </div>
  );
}