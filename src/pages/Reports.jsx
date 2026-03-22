import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Calendar } from 'lucide-react';
import ReportCard, { buildReportCardHTML, REPORT_CARD_STYLES } from '../components/reports/ReportCard';
import MarkList from '../components/reports/MarkList';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

const GRADES = ['Grade 7', 'Grade 8', 'Grade 9'];
const TERMS = ['Term 1', 'Term 2', 'Term 3'];
const EXAM_TYPES = ['Mid Term', 'End Term'];

const SUBJECTS = [
  'mathematics','english','kiswahili','integrated_science',
  'agriculture','social_studies','pretechnical_studies','religious_studies','creative_art'
];

function getTotal(student) {
  return SUBJECTS.reduce((sum, s) => sum + (Number(student[s]) || 0), 0);
}

export default function Reports() {
  const [filters, setFilters] = useState({ grade: 'Grade 7', term: 'Term 1', exam_type: 'Mid Term' });
  const [openingDate, setOpeningDate] = useState('');
  const [closingDate, setClosingDate] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: () => base44.entities.Teacher.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });
  const profile = teachers[0] || null;

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students-reports', filters, user?.email],
    queryFn: () => base44.entities.Student.filter({
      teacher_email: user?.email,
      grade: filters.grade,
      term: filters.term,
      exam_type: filters.exam_type,
    }),
    enabled: !!user?.email,
  });

  const rankedStudents = [...students]
    .sort((a, b) => getTotal(b) - getTotal(a))
    .map((s, i) => ({ ...s, rank: i + 1 }));

  const update = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <FileText className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm">Generate report cards and mark lists</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Select Class & Exam</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[140px]">
              <Label className="text-xs text-muted-foreground">Grade</Label>
              <Select value={filters.grade} onValueChange={v => update('grade', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="min-w-[130px]">
              <Label className="text-xs text-muted-foreground">Term</Label>
              <Select value={filters.term} onValueChange={v => update('term', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="min-w-[140px]">
              <Label className="text-xs text-muted-foreground">Exam Type</Label>
              <Select value={filters.exam_type} onValueChange={v => update('exam_type', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{EXAM_TYPES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-end pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-xs text-muted-foreground">Opening Date</Label>
                <Input type="date" className="mt-1 h-8 text-sm" value={openingDate} onChange={e => setOpeningDate(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-xs text-muted-foreground">Closing Date</Label>
                <Input type="date" className="mt-1 h-8 text-sm" value={closingDate} onChange={e => setClosingDate(e.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mark List Print Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {students.length} student{students.length !== 1 ? 's' : ''} · {filters.grade}
        </h2>
        <MarkList
          students={rankedStudents}
          grade={filters.grade}
          term={filters.term}
          examType={filters.exam_type}
          profile={profile}
          openingDate={openingDate}
          closingDate={closingDate}
        />
      </div>

      {/* Report Cards */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : rankedStudents.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="text-center py-12 text-muted-foreground">
            No students found for the selected filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {rankedStudents.map(student => (
            <ReportCard
              key={student.id}
              student={student}
              rank={student.rank}
              totalStudents={rankedStudents.length}
              profile={profile}
              openingDate={openingDate ? new Date(openingDate).toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
              closingDate={closingDate ? new Date(closingDate).toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
            />
          ))}
        </div>
      )}
    </div>
  );
}