import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, MapPin, Mail, Phone, Users, GraduationCap, CheckCircle2, PauseCircle,
  UserCog, Link2, Merge, Archive, History,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import InviteList from '@/components/school/InviteList';
import InviteHeadteacherDialog from '@/components/school/InviteHeadteacherDialog';
import LinkAccountDialog from '@/components/school/LinkAccountDialog';
import MergeSchoolDialog from '@/components/school/MergeSchoolDialog';
import DeleteSchoolDialog from '@/components/school/DeleteSchoolDialog';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
  expired: 'bg-muted text-muted-foreground border-border',
  archived: 'bg-muted text-muted-foreground border-border',
};

const COUNT_ROWS = [
  ['TeacherProfile', 'Teachers'],
  ['StudentRegister', 'Learners'],
  ['Student', 'Marks records'],
  ['Attendance', 'Attendance'],
  ['SchoolClass', 'Classes'],
  ['Submission', 'Submissions'],
  ['Payment', 'Payments'],
  ['PlatformLicence', 'Subscriptions'],
];

export default function SchoolDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const { data: school, isLoading, isError } = useQuery({
    queryKey: ['school', id],
    queryFn: () => base44.entities.School.get(id),
    retry: false,
  });

  const schoolId = school?.school_id || school?.id;

  const { data: stats } = useQuery({
    queryKey: ['school-stats', id],
    queryFn: async () => (await base44.functions.invoke('platformAccount', { action: 'schoolStats', school_id: id })).data,
    enabled: !!school,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['school-detail-teachers', schoolId],
    queryFn: () => base44.entities.TeacherProfile.filter({ school_id: schoolId }, 'teacher_name', 100),
    enabled: !!schoolId,
  });

  const { data: invites = [] } = useQuery({
    queryKey: ['school-detail-invites', schoolId],
    queryFn: () => base44.entities.SchoolInvite.filter({ school_id: schoolId }, '-created_date', 50),
    enabled: !!schoolId,
  });

  const { data: audit = [] } = useQuery({
    queryKey: ['school-audit', schoolId],
    queryFn: () => base44.entities.AuditLog.filter({ school_id: schoolId }, '-created_date', 15),
    enabled: !!schoolId,
  });

  const { data: allSchools = [] } = useQuery({
    queryKey: ['all-schools'],
    queryFn: () => base44.entities.School.list('-created_date', 200),
  });

  useEffect(() => {
    if (!isError) return;
    const meta = document.createElement('meta');
    meta.name = 'prerender-status-code';
    meta.content = '404';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [isError]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['school', id] });
    queryClient.invalidateQueries({ queryKey: ['school-stats', id] });
    queryClient.invalidateQueries({ queryKey: ['school-detail-teachers', schoolId] });
    queryClient.invalidateQueries({ queryKey: ['school-detail-invites', schoolId] });
    queryClient.invalidateQueries({ queryKey: ['school-audit', schoolId] });
  };

  const setStatus = async (status) => {
    await base44.entities.School.update(school.id, { subscription_status: status });
    toast({ title: status === 'active' ? 'School activated' : 'School suspended', description: school.name });
    refresh();
  };

  const inviteAction = async (action, invite) => {
    const res = await base44.functions.invoke('platformAccount', { action, invite_id: invite.id });
    if (res.data?.error) {
      toast({ title: 'Action failed', description: res.data.error, variant: 'destructive' });
      return;
    }
    toast({ title: action === 'resendInvite' ? 'Invitation resent' : 'Invitation cancelled' });
    refresh();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !school) {
    return (
      <div className="p-6 max-w-md mx-auto text-center py-20 space-y-2">
        <h2 className="text-lg font-bold">School not found</h2>
        <p className="text-sm text-muted-foreground">This school may have been deleted.</p>
        <Button asChild variant="outline" className="mt-2">
          <Link to="/super-admin/schools">Back to schools</Link>
        </Button>
      </div>
    );
  }

  const status = school.subscription_status || 'pending';

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
        <Link to="/super-admin/schools"><ArrowLeft className="w-4 h-4" /> All schools</Link>
      </Button>

      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold">{school.name}</h1>
          <Badge variant="outline" className="font-mono text-[11px]">{school.code}</Badge>
          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>{status}</span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {[school.sub_county, school.county].filter(Boolean).join(', ') || 'Location not set'}</p>
          <p className="flex items-center gap-1"><UserCog className="w-3 h-3" /> {school.headteacher_name || 'No headteacher'} {school.headteacher_email ? `· ${school.headteacher_email}` : ''}</p>
          {school.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {school.email}</p>}
          {school.contact_number && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {school.contact_number}</p>}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {status === 'active' ? (
          <Button size="sm" variant="outline" className="gap-1.5 text-destructive" onClick={() => setStatus('suspended')}>
            <PauseCircle className="w-3.5 h-3.5" /> Suspend school
          </Button>
        ) : (
          status !== 'archived' && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setStatus('active')}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Approve / activate
            </Button>
          )
        )}
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setInviteOpen(true)}>
          <UserCog className="w-3.5 h-3.5" /> Invite headteacher
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setLinkOpen(true)}>
          <Link2 className="w-3.5 h-3.5" /> Link existing account
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setMergeOpen(true)}>
          <Merge className="w-3.5 h-3.5" /> Merge duplicate
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setManageOpen(true)}>
          <Archive className="w-3.5 h-3.5" /> Archive / delete
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {COUNT_ROWS.map(([key, label]) => (
          <Card key={key}>
            <CardContent className="p-3">
              <p className="text-[11px] text-muted-foreground">{label}</p>
              <p className="text-lg font-bold">{Number(stats?.counts?.[key] || 0)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Teachers
          </p>
          {teachers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No teachers yet.</p>
          ) : (
            teachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center justify-between gap-2 text-xs border-b last:border-b-0 py-1.5">
                <div className="min-w-0">
                  <p className="font-medium truncate">{teacher.teacher_name || teacher.teacher_email}</p>
                  <p className="text-muted-foreground truncate">
                    {[...(teacher.grades || []), ...(teacher.learning_areas || [])].join(' · ') || teacher.teacher_email}
                  </p>
                </div>
                <Badge variant="outline" className="text-[11px] shrink-0">{teacher.status || 'invited'}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invitations</p>
          <InviteList
            invites={invites}
            onResend={(invite) => inviteAction('resendInvite', invite)}
            onCancel={(invite) => inviteAction('cancelInvite', invite)}
            emptyText="No invitations sent for this school yet."
          />
        </CardContent>
      </Card>

      {audit.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Audit trail
            </p>
            {audit.map((entry) => (
              <p key={entry.id} className="text-xs text-muted-foreground">
                <span className="text-foreground font-medium">{(entry.action || '').replace(/_/g, ' ')}</span>
                {' · '}{entry.actor_email}
                {' · '}{new Date(entry.created_date).toLocaleString()}
                {entry.details ? ` · ${entry.details}` : ''}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <GraduationCap className="w-3.5 h-3.5" /> School data is isolated — staff see only their own school.
      </div>

      <InviteHeadteacherDialog open={inviteOpen} school={school} onOpenChange={setInviteOpen} onDone={refresh} />
      <LinkAccountDialog open={linkOpen} school={school} onOpenChange={setLinkOpen} onLinked={refresh} />
      <MergeSchoolDialog open={mergeOpen} school={school} schools={allSchools} onOpenChange={setMergeOpen} onMerged={refresh} />
      <DeleteSchoolDialog open={manageOpen} school={school} onOpenChange={setManageOpen} onChanged={refresh} />
    </div>
  );
}