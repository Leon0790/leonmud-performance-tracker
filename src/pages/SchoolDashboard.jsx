import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import {
  Users, GraduationCap, Layers, BookOpen, ClipboardCheck, Megaphone, TrendingUp, AlertCircle, ArrowRight,
} from 'lucide-react';
import { useAccount } from '@/hooks/use-account';
import SchoolCharts from '@/components/school/SchoolCharts';
import { averageByGrade, averageBySubject, studentScore, bandFor } from '@/utils/schoolAnalytics';
import { TERMS, EXAM_TYPES } from '@/utils/learningAreas';
import { format } from 'date-fns';

export default function SchoolDashboard() {
  const { schoolName, schoolId, loading } = useAccount();
  const [term, setTerm] = useState('Term 1');
  const [examType, setExamType] = useState('End Term');

  const { data: teachers = [] } = useQuery({
    queryKey: ['school-teachers', schoolId],
    queryFn: () => base44.entities.TeacherProfile.filter({ school_id: schoolId }, 'teacher_name', 200),
    enabled: !!schoolId,
  });

  const { data: learnerCount = 0 } = useQuery({
    queryKey: ['school-learner-count', schoolId],
    queryFn: () => base44.entities.StudentRegister.count({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['school-classes', schoolId],
    queryFn: () => base44.entities.SchoolClass.filter({ school_id: schoolId }, 'name', 200),
    enabled: !!schoolId,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['school-students', schoolId, term, examType],
    queryFn: () => base44.entities.Student.filter({ school_id: schoolId, term, exam_type: examType }, '-created_date', 500),
    enabled: !!schoolId,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['school-submissions', schoolId],
    queryFn: () => base44.entities.Submission.filter({ school_id: schoolId }, '-created_date', 200),
    enabled: !!schoolId,
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['school-announcements', schoolId],
    queryFn: () => base44.entities.Announcement.filter({ school_id: schoolId }, '-created_date', 10),
    enabled: !!schoolId,
  });

  const learningAreas = new Set();
  teachers.forEach((t) => (t.learning_areas || []).forEach((a) => learningAreas.add(a)));
  classes.forEach((c) => (c.learning_areas || []).forEach((a) => learningAreas.add(a)));

  const termSubmissions = submissions.filter((s) => s.term === term);
  const submittedEmails = new Set(termSubmissions.map((s) => s.teacher_email));
  const yetToSubmit = teachers.filter((t) => !submittedEmails.has(t.teacher_email));
  const approved = termSubmissions.filter((s) => s.status === 'approved').length;
  const completion = teachers.length ? Math.round((submittedEmails.size / teachers.length) * 100) : 0;

  const scored = students.map((s) => ({ ...s, score: studentScore(s) })).filter((s) => s.score !== null);
  const classAverage = scored.length ? Math.round((scored.reduce((a, b) => a + b.score, 0) / scored.length) * 10) / 10 : 0;

  const activity = [
    ...announcements.map((a) => ({ id: `a-${a.id}`, type: 'Announcement', text: a.title, who: a.author_name, date: a.created_date })),
    ...submissions.slice(0, 10).map((s) => ({
      id: `s-${s.id}`,
      type: 'Submission',
      text: `${s.grade} ${s.term} ${s.exam_type} — ${s.status.replace('_', ' ')}`,
      who: s.teacher_name || s.teacher_email,
      date: s.submitted_date || s.created_date,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

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
        <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto" />
        <h2 className="text-lg font-bold">No school linked yet</h2>
        <p className="text-sm text-muted-foreground">Ask the platform administrator to link your account to a school.</p>
      </div>
    );
  }

  const stats = [
    { label: 'Teachers', value: teachers.length, icon: Users, href: '/school/teachers' },
    { label: 'Learners', value: learnerCount, icon: GraduationCap, href: '/students/list' },
    { label: 'Classes', value: classes.length, icon: Layers, href: '/school/classes' },
    { label: 'Learning areas', value: learningAreas.size, icon: BookOpen, href: '/school/teachers' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">School dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{schoolName || 'Your school'} · whole-school performance and progress</p>
        </div>
        <div className="flex gap-2">
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={examType} onValueChange={setExamType}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{EXAM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Link key={s.label} to={s.href}>
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <s.icon className="w-4 h-4" /> {s.label}
                </div>
                <p className="text-xl font-bold mt-1">{s.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4" /> Assessment completion</p>
              <Badge variant="outline" className="text-[11px]">{term}</Badge>
            </div>
            <p className="text-2xl font-bold">{completion}%</p>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${completion}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{approved} record(s) approved by you this term</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> School average</p>
            <p className="text-2xl font-bold">{classAverage}%</p>
            <p className="text-xs text-muted-foreground">
              {scored.length} learner record(s) · overall band {bandFor(classAverage)}
            </p>
          </CardContent>
        </Card>
      </div>

      <SchoolCharts byGrade={averageByGrade(students)} bySubject={averageBySubject(students)} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-amber-600" /> Teachers yet to submit</p>
              <Badge variant="outline" className="text-[11px]">{yetToSubmit.length}</Badge>
            </div>
            {yetToSubmit.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3">Every teacher has submitted marks for {term}.</p>
            ) : (
              <div className="space-y-1.5">
                {yetToSubmit.slice(0, 8).map((t) => (
                  <p key={t.id} className="text-xs text-muted-foreground flex items-center justify-between">
                    <span className="truncate">{t.teacher_name || t.teacher_email}</span>
                    <Link to="/school/submissions" className="text-primary shrink-0 ml-2">review</Link>
                  </p>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" className="w-full gap-1.5 mt-1" asChild>
              <Link to="/school/submissions">Open submissions <ArrowRight className="w-3.5 h-3.5" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-1.5"><Megaphone className="w-4 h-4 text-primary" /> Recent school activity</p>
            {activity.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3">No activity yet.</p>
            ) : (
              <div className="space-y-2">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{item.text}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{item.type} · {item.who || '—'}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {item.date ? format(new Date(item.date), 'd MMM') : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1" asChild><Link to="/school/announcements">Announcements</Link></Button>
              <Button variant="outline" size="sm" className="flex-1" asChild><Link to="/reports">School results</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/school/teachers">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Manage teachers</p>
                <p className="text-xs text-muted-foreground">Invite teachers, assign grades and learning areas</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/lesson-plans/access">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Lesson plan access</p>
                <p className="text-xs text-muted-foreground">Buy lesson-plan access for your teachers</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}