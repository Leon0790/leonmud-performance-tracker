import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { CalendarCheck, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const GRADES = ['Grade 7', 'Grade 8', 'Grade 9'];
const TERMS = ['Term 1', 'Term 2', 'Term 3'];
const STATUS_OPTIONS = ['Present', 'Absent', 'Late'];

const statusIcon = (s) => {
  if (s === 'Present') return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (s === 'Absent') return <XCircle className="w-4 h-4 text-red-500" />;
  return <Clock className="w-4 h-4 text-amber-500" />;
};

const statusBadge = (s) => {
  if (s === 'Present') return 'bg-green-100 text-green-700';
  if (s === 'Absent') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
};

export default function Attendance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [grade, setGrade] = useState('Grade 7');
  const [term, setTerm] = useState('Term 1');
  const [markingStatus, setMarkingStatus] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Load students from the register for this grade
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['attendance-students', grade, user?.email],
    queryFn: () => base44.entities.StudentRegister.filter({ teacher_email: user?.email, grade }),
    enabled: !!user?.email,
  });

  // Load existing attendance for the selected date/grade/term
  const { data: existingAttendance = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance-records', selectedDate, grade, term, user?.email],
    queryFn: () => base44.entities.Attendance.filter({
      teacher_email: user?.email,
      grade,
      date: selectedDate,
      term,
    }),
    enabled: !!user?.email,
  });

  // Build a map of admission_number -> existing record
  const existingMap = useMemo(() => {
    const m = {};
    existingAttendance.forEach(r => { m[r.admission_number || r.student_name] = r; });
    return m;
  }, [existingAttendance]);

  const saveMutation = useMutation({
    mutationFn: async (entries) => {
      const promises = entries.map(entry => {
        const key = entry.admission_number || entry.student_name;
        const existing = existingMap[key];
        if (existing) {
          return base44.entities.Attendance.update(existing.id, { status: entry.status });
        }
        return base44.entities.Attendance.create(entry);
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      toast({ title: 'Attendance saved!' });
      setMarkingStatus({});
    },
  });

  const getStatus = (student) => {
    const key = student.admission_number || `${student.first_name} ${student.last_name}`;
    return markingStatus[key] || existingMap[key]?.status || 'Present';
  };

  const setStatus = (student, status) => {
    const key = student.admission_number || `${student.first_name} ${student.last_name}`;
    setMarkingStatus(prev => ({ ...prev, [key]: status }));
  };

  const handleSaveAll = () => {
    const entries = students.map(s => ({
      student_name: `${s.first_name} ${s.last_name}`,
      admission_number: s.admission_number || '',
      grade,
      class_name: s.class_name || '',
      date: selectedDate,
      term,
      status: getStatus(s),
      teacher_email: user.email,
    }));
    saveMutation.mutate(entries);
  };

  // Compute attendance stats
  const presentCount = students.filter(s => getStatus(s) === 'Present').length;
  const absentCount = students.filter(s => getStatus(s) === 'Absent').length;
  const lateCount = students.filter(s => getStatus(s) === 'Late').length;
  const attendanceRate = students.length > 0 ? ((presentCount + lateCount) / students.length * 100).toFixed(0) : 0;
  const lowAttendance = Number(attendanceRate) < 75;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <CalendarCheck className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-muted-foreground text-sm">Mark daily student attendance</p>
        </div>
      </div>

      {/* Controls */}
      <Card className="border-border/50">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div>
            <Label className="text-xs text-muted-foreground">Date</Label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="flex h-9 mt-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Grade</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="w-32 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Term</Label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="w-28 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleSaveAll} disabled={saveMutation.isPending || students.length === 0}>
            {saveMutation.isPending ? 'Saving...' : 'Save Attendance'}
          </Button>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Present', value: presentCount, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
          { label: 'Absent', value: absentCount, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
          { label: 'Late', value: lateCount, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Rate', value: `${attendanceRate}%`, color: lowAttendance ? 'text-red-600' : 'text-green-600', bg: lowAttendance ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl border p-3 ${stat.bg}`}>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {lowAttendance && students.length > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Attendance rate is below 75% — action required.
        </div>
      )}

      {/* Student list */}
      {loadingStudents || loadingAttendance ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="text-center py-12 text-muted-foreground">
            No students registered for {grade}. Register students first.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{students.length} Students — {format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMMM d yyyy')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {students.map(student => {
              const status = getStatus(student);
              return (
                <div key={student.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {statusIcon(status)}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{student.first_name} {student.last_name}</p>
                      <p className="text-xs text-muted-foreground">{student.admission_number || 'No Adm#'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => setStatus(student, s)}
                        className={`px-2 py-1 rounded text-xs font-medium border transition-all ${
                          status === s
                            ? s === 'Present' ? 'bg-green-500 text-white border-green-500'
                            : s === 'Absent' ? 'bg-red-500 text-white border-red-500'
                            : 'bg-amber-500 text-white border-amber-500'
                            : 'bg-background border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}