import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { generateProgressReportPDF } from '@/utils/generateProgressReportPDF';
import { format } from 'date-fns';

export default function ProgressReportGenerator({ student, marksRecords, profile }) {
  const [open, setOpen] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [openingDate, setOpeningDate] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [comment, setComment] = useState('');
  const [classTeacherName, setClassTeacherName] = useState(profile?.full_name || '');
  const [classTeacherDate, setClassTeacherDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [headteacherName, setHeadteacherName] = useState('');
  const [headteacherComment, setHeadteacherComment] = useState('');
  const [headteacherDate, setHeadteacherDate] = useState('');
  const [generating, setGenerating] = useState(false);

  const studentName = student
    ? `${student.first_name || ''} ${student.last_name || ''}`.trim()
    : marksRecords[0]?.name || 'Student';

  const admNo = student?.admission_number || marksRecords[0]?.admission_number;
  const grade = student?.grade || marksRecords[0]?.grade;

  // Fetch attendance records for this student
  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['progress-report-attendance', admNo, grade],
    queryFn: () => base44.entities.Attendance.filter({ admission_number: admNo }),
    enabled: !!admNo,
  });

  const fmtDate = (d) =>
    d ? new Date(d + 'T12:00:00').toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      generateProgressReportPDF({
        student,
        marksRecords,
        attendanceRecords,
        profile,
        schoolName,
        openingDate: fmtDate(openingDate),
        closingDate: fmtDate(closingDate),
        comment,
        classTeacherName,
        classTeacherDate: fmtDate(classTeacherDate),
        headteacherName,
        headteacherComment,
        headteacherDate: fmtDate(headteacherDate),
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader
        className="pb-3 cursor-pointer select-none"
        onClick={() => setOpen(v => !v)}
      >
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Generate PDF Progress Report
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </CardTitle>
        {!open && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Full term report with marks, attendance &amp; signature blocks
          </p>
        )}
      </CardHeader>

      {open && (
        <CardContent className="space-y-5">
          {/* Preview summary */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm space-y-1">
            <p className="font-semibold text-primary">{studentName}</p>
            <p className="text-xs text-muted-foreground">
              {grade} · Adm: {admNo || '—'} · {marksRecords.length} exam record(s) · {attendanceRecords.length} attendance day(s)
            </p>
          </div>

          {/* School details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <Label className="text-xs text-muted-foreground">School Name (optional)</Label>
              <Input className="mt-1" placeholder="e.g. Sunrise Primary School" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Opening Date</Label>
              <input type="date" value={openingDate} onChange={e => setOpeningDate(e.target.value)}
                className="flex h-9 mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Closing Date</Label>
              <input type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)}
                className="flex h-9 mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            </div>
          </div>

          {/* Class teacher */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Class Teacher</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input className="mt-1" value={classTeacherName} onChange={e => setClassTeacherName(e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Date Signed</Label>
                <input type="date" value={classTeacherDate} onChange={e => setClassTeacherDate(e.target.value)}
                  className="flex h-9 mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Class Teacher's Comment</Label>
              <textarea
                className="w-full mt-1 text-sm border border-input rounded-md px-3 py-2 resize-y bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                rows={4}
                placeholder="Overall remarks on student's performance and conduct this term..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>
          </div>

          {/* Head teacher */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Head Teacher <span className="normal-case font-normal">(optional)</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input className="mt-1" value={headteacherName} onChange={e => setHeadteacherName(e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Date Signed</Label>
                <input type="date" value={headteacherDate} onChange={e => setHeadteacherDate(e.target.value)}
                  className="flex h-9 mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Head Teacher's Comment</Label>
              <textarea
                className="w-full mt-1 text-sm border border-input rounded-md px-3 py-2 resize-y bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                rows={3}
                placeholder="Optional endorsement from the head teacher..."
                value={headteacherComment}
                onChange={e => setHeadteacherComment(e.target.value)}
              />
            </div>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleGenerate}
            disabled={generating || marksRecords.length === 0}
          >
            <Download className="w-4 h-4" />
            {generating ? 'Generating PDF...' : 'Download Progress Report PDF'}
          </Button>

          {marksRecords.length === 0 && (
            <p className="text-xs text-center text-muted-foreground">No marks records found for this student.</p>
          )}
        </CardContent>
      )}
    </Card>
  );
}