import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Calendar, Printer, Download, Upload, X } from 'lucide-react';
import ReportCard, { buildReportCardHTML, REPORT_CARD_STYLES } from '../components/reports/ReportCard';
import MarkList from '../components/reports/MarkList';
import { Button } from '@/components/ui/button';
import { downloadAllReportsPDF } from '@/utils/generateReportPDF';
import PremiumLock from '@/components/PremiumLock';
import { usePremium } from '@/hooks/use-premium';

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
  const [schoolLogoDataUrl, setSchoolLogoDataUrl] = useState(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [logoError, setLogoError] = useState('');
  const { isPremium, isLoading: isPremiumLoading } = usePremium();
  const logoInputRef = useRef(null);

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

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoError('');
    if (!file.type.startsWith('image/')) {
      setLogoError('Please upload an image file (PNG, JPG, etc.), not a Word or PDF document.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) setSchoolLogoDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePrintAll = () => {
    if (!rankedStudents.length) return;
    const allHTML = rankedStudents.map(s =>
      buildReportCardHTML(s, s.rank, rankedStudents.length, profile, fmtDate(openingDate), fmtDate(closingDate), '', profile?.full_name || '', '', '', schoolLogoDataUrl, '', '')
    ).join('');
    const fullHtml = `<!DOCTYPE html><html><head><title>All Report Cards</title><style>${REPORT_CARD_STYLES}</style></head><body>${allHTML}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    win.onload = () => { setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 300); };
  };

  const handleDownloadAllPDF = async () => {
    if (!rankedStudents.length) return;
    setIsDownloadingAll(true);
    setTimeout(() => {
      downloadAllReportsPDF(rankedStudents, profile, fmtDate(openingDate), fmtDate(closingDate), schoolLogoDataUrl);
      setIsDownloadingAll(false);
    }, 50);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <FileText className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm">Generate report cards and mark lists</p>
        </div>
      </div>

      {/* Filters + Logo */}
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

            {/* School Logo Upload — Premium */}
            <div>
              <Label className="text-xs text-muted-foreground">School Logo</Label>
              <div className="flex items-center gap-3 mt-1">
                <PremiumLock isPremium={isPremium} isLoading={isPremiumLoading} feature="School Logo & Branding" mode="overlay">
                  {schoolLogoDataUrl ? (
                    <div className="flex items-center gap-3">
                      <div className="relative border-2 border-primary/40 rounded-lg p-1 bg-white">
                        <img src={schoolLogoDataUrl} alt="School Logo" className="h-16 w-16 object-contain" />
                        <button
                          onClick={() => { setSchoolLogoDataUrl(null); logoInputRef.current.value = ''; }}
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-destructive/80"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-xs text-green-600 font-medium">✓ Logo loaded</div>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => isPremium && logoInputRef.current?.click()}>
                      <Upload className="w-3.5 h-3.5 mr-1" /> Upload Logo
                    </Button>
                  )}
                </PremiumLock>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                {logoError && <p className="text-xs text-destructive mt-1 max-w-xs">{logoError}</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold">
          {students.length} student{students.length !== 1 ? 's' : ''} &middot; {filters.grade}
        </h2>
        <div className="flex gap-2 flex-wrap">
          <PremiumLock isPremium={isPremium} isLoading={isPremiumLoading} feature="Print & PDF Download" mode="overlay">
            <Button variant="outline" size="sm" onClick={handlePrintAll} disabled={!rankedStudents.length}>
              <Printer className="w-4 h-4 mr-1" /> Print All
            </Button>
          </PremiumLock>
          <PremiumLock isPremium={isPremium} isLoading={isPremiumLoading} feature="Download All PDF" mode="overlay">
            <Button size="sm" onClick={handleDownloadAllPDF} disabled={!rankedStudents.length || isDownloadingAll}>
              <Download className="w-4 h-4 mr-1" /> {isDownloadingAll ? 'Generating...' : 'Download All PDF'}
            </Button>
          </PremiumLock>
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
              openingDate={fmtDate(openingDate)}
              closingDate={fmtDate(closingDate)}
              schoolLogoDataUrl={schoolLogoDataUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}