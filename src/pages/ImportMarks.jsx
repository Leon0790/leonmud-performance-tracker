import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, CheckCircle, AlertCircle, ArrowLeft, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const GRADES = ['Grade 7', 'Grade 8', 'Grade 9'];
const TERMS = ['Term 1', 'Term 2', 'Term 3'];
const EXAM_TYPES = ['Mid Term', 'End Term'];

const MARK_HEADERS = [
  'name', 'admission_number',
  'mathematics', 'mathematics_band',
  'english_p1', 'english_p2', 'english', 'english_band',
  'kiswahili_p1', 'kiswahili_p2', 'kiswahili', 'kiswahili_band',
  'integrated_science_p1', 'integrated_science_p2', 'integrated_science', 'integrated_science_band',
  'agriculture', 'agriculture_band',
  'social_studies', 'social_studies_band',
  'pretechnical_studies', 'pretechnical_studies_band',
  'religious_studies', 'religious_studies_band',
  'creative_art', 'creative_art_band',
  'overall_band'
];

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
}

export default function ImportMarks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState('');
  const [results, setResults] = useState(null);
  const [filters, setFilters] = useState({ grade: 'Grade 7', term: 'Term 1', exam_type: 'Mid Term' });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch existing students for this class/term/exam to allow updates
  const { data: existingStudents = [] } = useQuery({
    queryKey: ['students', filters, user?.email],
    queryFn: () => base44.entities.Student.filter({
      teacher_email: user?.email,
      grade: filters.grade,
      term: filters.term,
      exam_type: filters.exam_type,
    }),
    enabled: !!user?.email,
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setResults(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result);
      setParsed(rows);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const sample = [
      MARK_HEADERS.join(','),
      '"John Doe","A001","85","ME1","42","44","86","ME1","38","40","78","ME2","60","25","85","ME1","72","ME1","68","ME2","75","ME1","80","ME1","77","ME1","ME1"',
    ].join('\n');
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'marks_import_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCurrentMarks = () => {
    if (!existingStudents.length) return;
    const rows = [
      MARK_HEADERS.join(','),
      ...existingStudents.map(s => MARK_HEADERS.map(h => `"${s[h] ?? ''}"`).join(',')),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks_${filters.grade}_${filters.term}_${filters.exam_type}.csv`.replace(/ /g, '_');
    a.click();
    URL.revokeObjectURL(url);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const successes = [];
      const updated = [];
      const failures = [];

      for (const row of parsed) {
        if (!row.name) {
          failures.push({ name: row.name || '?', reason: 'Missing student name' });
          continue;
        }

        // Convert numeric fields
        const numFields = [
          'mathematics', 'english_p1', 'english_p2', 'english',
          'kiswahili_p1', 'kiswahili_p2', 'kiswahili',
          'integrated_science_p1', 'integrated_science_p2', 'integrated_science',
          'agriculture', 'social_studies', 'pretechnical_studies',
          'religious_studies', 'creative_art'
        ];
        const data = { ...row };
        numFields.forEach(f => {
          if (data[f] !== '' && data[f] !== undefined) data[f] = Number(data[f]) || 0;
          else delete data[f];
        });

        // Check if student already exists (match by admission_number or name)
        const existing = existingStudents.find(s =>
          (row.admission_number && s.admission_number === row.admission_number) ||
          s.name?.toLowerCase() === row.name?.toLowerCase()
        );

        if (existing) {
          await base44.entities.Student.update(existing.id, data);
          updated.push(row.name);
        } else {
          await base44.entities.Student.create({
            ...data,
            grade: filters.grade,
            term: filters.term,
            exam_type: filters.exam_type,
            teacher_email: user.email,
          });
          successes.push(row.name);
        }
      }
      return { successes, updated, failures };
    },
    onSuccess: (res) => {
      setResults(res);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['all-students'] });
      toast({ title: `Done! ${res.successes.length} created, ${res.updated.length} updated.` });
    },
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/marks">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <Upload className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Import Marks from CSV</h1>
          <p className="text-muted-foreground text-sm">Bulk upload or update student marks</p>
        </div>
      </div>

      {/* Step 1: Select Class */}
      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-base">Step 1 — Select Grade, Term & Exam</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[140px]">
              <Label className="text-xs text-muted-foreground">Grade</Label>
              <Select value={filters.grade} onValueChange={v => setFilters(f => ({ ...f, grade: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="min-w-[130px]">
              <Label className="text-xs text-muted-foreground">Term</Label>
              <Select value={filters.term} onValueChange={v => setFilters(f => ({ ...f, term: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="min-w-[140px]">
              <Label className="text-xs text-muted-foreground">Exam Type</Label>
              <Select value={filters.exam_type} onValueChange={v => setFilters(f => ({ ...f, exam_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{EXAM_TYPES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {existingStudents.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              {existingStudents.length} existing records found — matching rows will be updated, not duplicated.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Download Template / Export */}
      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-base">Step 2 — Get Template</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <FileText className="w-4 h-4 mr-2" /> Download CSV Template
          </Button>
          <Button variant="outline" onClick={handleExportCurrentMarks} disabled={existingStudents.length === 0}>
            <Download className="w-4 h-4 mr-2" /> Export Current Marks ({existingStudents.length})
          </Button>
        </CardContent>
      </Card>

      {/* Step 3: Upload */}
      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-base">Step 3 — Upload CSV</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/60 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-10 h-10 text-primary/40 mx-auto mb-3" />
            <p className="text-sm font-medium">{fileName || 'Click to select a CSV file'}</p>
            <p className="text-xs text-muted-foreground mt-1">Use the template above for correct column order</p>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </div>

          {parsed && (
            <div className="space-y-3">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
                <p className="font-medium text-primary">{parsed.length} rows detected in file</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      {['Name', 'Adm#', 'Maths', 'English', 'Kiswahili', 'Sci'].map(h => (
                        <th key={h} className="px-2 py-1.5 text-left border border-border">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.slice(0, 6).map((r, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="px-2 py-1 border border-border">{r.name}</td>
                        <td className="px-2 py-1 border border-border">{r.admission_number}</td>
                        <td className="px-2 py-1 border border-border">{r.mathematics}</td>
                        <td className="px-2 py-1 border border-border">{r.english}</td>
                        <td className="px-2 py-1 border border-border">{r.kiswahili}</td>
                        <td className="px-2 py-1 border border-border">{r.integrated_science}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.length > 6 && <p className="text-xs text-muted-foreground mt-1">...and {parsed.length - 6} more rows</p>}
              </div>
              <Button
                className="w-full"
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                {importMutation.isPending ? 'Importing...' : `Import ${parsed.length} Records into ${filters.grade} · ${filters.term} · ${filters.exam_type}`}
              </Button>
            </div>
          )}

          {results && (
            <div className="space-y-2">
              {results.successes.length > 0 && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{results.successes.length} new records created</span>
                </div>
              )}
              {results.updated.length > 0 && (
                <div className="flex items-center gap-2 text-blue-700 bg-blue-50 rounded-lg p-3">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{results.updated.length} existing records updated</span>
                </div>
              )}
              {results.failures.length > 0 && (
                <div className="flex items-start gap-2 text-destructive bg-destructive/10 rounded-lg p-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">{results.failures.length} rows failed:</p>
                    {results.failures.map((f, i) => <p key={i} className="text-xs">{f.name}: {f.reason}</p>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}