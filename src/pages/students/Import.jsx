import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

const CSV_HEADERS = ['first_name','last_name','admission_number','date_of_birth','gender','grade','class_name','stream','parent_name','parent_phone','parent_email','address','status','notes'];

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
}

export default function ImportStudents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState('');
  const [results, setResults] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['student-register', user?.email],
    queryFn: () => base44.entities.StudentRegister.filter({ teacher_email: user?.email }),
    enabled: !!user?.email,
  });

  const [isParsing, setIsParsing] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setResults(null);
    setParsed(null);

    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const rows = parseCSV(ev.target.result);
        setParsed(rows);
      };
      reader.readAsText(file);
    } else {
      // PDF or DOCX — upload and use AI extraction
      setIsParsing(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: {
            type: 'object',
            properties: {
              students: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    first_name: { type: 'string' },
                    last_name: { type: 'string' },
                    admission_number: { type: 'string' },
                    date_of_birth: { type: 'string' },
                    gender: { type: 'string' },
                    grade: { type: 'string' },
                    class_name: { type: 'string' },
                    stream: { type: 'string' },
                    parent_name: { type: 'string' },
                    parent_phone: { type: 'string' },
                    parent_email: { type: 'string' },
                    address: { type: 'string' },
                    status: { type: 'string' },
                    notes: { type: 'string' },
                  }
                }
              }
            }
          }
        });
        if (result.status === 'success' && result.output?.students) {
          setParsed(result.output.students);
        } else {
          toast({ title: 'Could not extract student data from file', description: result.details || 'Please check the file format.' });
        }
      } catch (err) {
        toast({ title: 'File processing failed', description: err.message });
      } finally {
        setIsParsing(false);
      }
    }
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const successes = [];
      const failures = [];
      for (const row of parsed) {
        if (!row.first_name || !row.last_name || !row.grade) {
          failures.push({ row, reason: 'Missing required fields' });
          continue;
        }
        await base44.entities.StudentRegister.create({ ...row, teacher_email: user?.email, status: row.status || 'Active' });
        successes.push(row);
      }
      return { successes, failures };
    },
    onSuccess: (res) => {
      setResults(res);
      queryClient.invalidateQueries({ queryKey: ['student-register'] });
      toast({ title: `Imported ${res.successes.length} students.` });
    },
  });

  const handleDownloadTemplate = () => {
    const csv = [CSV_HEADERS.join(','), 'John,Doe,A001,2012-01-15,Male,Grade 7,7A,East,Jane Doe,0712345678,parent@email.com,Nairobi,Active,'].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'students_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const rows = [CSV_HEADERS.join(','), ...students.map(s => CSV_HEADERS.map(h => `"${s[h] || ''}"`).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'students_export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/students/list">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <Upload className="w-7 h-7 text-indigo-500" />
        <div>
          <h1 className="text-2xl font-bold">Bulk Import / Export</h1>
          <p className="text-muted-foreground text-sm">Import students from CSV or export existing records</p>
        </div>
      </div>

      {/* Export */}
      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-base">Export Students</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <FileText className="w-4 h-4 mr-2" /> Download CSV Template
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={students.length === 0}>
            <Download className="w-4 h-4 mr-2" /> Export {students.length} Students
          </Button>
        </CardContent>
      </Card>

      {/* Import */}
      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-base">Import from CSV, Word, or PDF</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
            onClick={() => !isParsing && fileInputRef.current?.click()}
          >
            {isParsing
              ? <Loader2 className="w-10 h-10 text-indigo-400 mx-auto mb-3 animate-spin" />
              : <Upload className="w-10 h-10 text-indigo-300 mx-auto mb-3" />}
            <p className="text-sm font-medium">{isParsing ? 'Extracting student data...' : (fileName || 'Click to select a file')}</p>
            <p className="text-xs text-muted-foreground mt-1">Supports CSV, Word (.docx), and PDF files</p>
            <input ref={fileInputRef} type="file" accept=".csv,.docx,.pdf" className="hidden" onChange={handleFileChange} />
          </div>

          {parsed && (
            <div className="space-y-3">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-indigo-700">{parsed.length} rows detected in file</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      {['Name','Adm#','Grade','Class','Status'].map(h => <th key={h} className="px-2 py-1.5 text-left border border-border">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.slice(0, 5).map((r, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="px-2 py-1 border border-border">{r.first_name} {r.last_name}</td>
                        <td className="px-2 py-1 border border-border">{r.admission_number}</td>
                        <td className="px-2 py-1 border border-border">{r.grade}</td>
                        <td className="px-2 py-1 border border-border">{r.class_name}</td>
                        <td className="px-2 py-1 border border-border">{r.status || 'Active'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.length > 5 && <p className="text-xs text-muted-foreground mt-1">...and {parsed.length - 5} more rows</p>}
              </div>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                {importMutation.isPending ? 'Importing...' : `Import ${parsed.length} Students`}
              </Button>
            </div>
          )}

          {results && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{results.successes.length} students imported successfully</span>
              </div>
              {results.failures.length > 0 && (
                <div className="flex items-start gap-2 text-destructive bg-destructive/10 rounded-lg p-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">{results.failures.length} rows failed:</p>
                    {results.failures.map((f, i) => <p key={i} className="text-xs">Row {i + 1}: {f.reason}</p>)}
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