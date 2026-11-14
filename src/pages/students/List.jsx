import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, Search, Upload, UserCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const GRADES = ['All Grades', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
const STATUSES = ['All Statuses', 'Active', 'Inactive', 'Transferred', 'Graduated'];

const statusColor = (s) => {
  if (s === 'Active') return 'bg-green-100 text-green-700';
  if (s === 'Inactive') return 'bg-gray-100 text-gray-600';
  if (s === 'Transferred') return 'bg-amber-100 text-amber-700';
  if (s === 'Graduated') return 'bg-blue-100 text-blue-700';
  return 'bg-muted text-muted-foreground';
};

export default function StudentsList() {
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All Grades');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: studentsByEmail = [], isLoading: loadingByEmail } = useQuery({
    queryKey: ['student-register-by-email', user?.email],
    queryFn: () => base44.entities.StudentRegister.filter({ teacher_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: studentsByCreator = [], isLoading: loadingByCreator } = useQuery({
    queryKey: ['student-register-by-creator', user?.email],
    queryFn: () => base44.entities.StudentRegister.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const students = useMemo(() => {
    const map = {};
    [...studentsByEmail, ...studentsByCreator].forEach(s => { map[s.id] = s; });
    return Object.values(map);
  }, [studentsByEmail, studentsByCreator]);

  const isLoading = loadingByEmail || loadingByCreator;

  const { containerRef, isRefreshing } = usePullToRefresh(async () => {
    await queryClient.invalidateQueries({ queryKey: ['student-register'] });
  });

  const filtered = students.filter(s => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const matchSearch = !search || fullName.includes(search.toLowerCase()) || (s.admission_number || '').toLowerCase().includes(search.toLowerCase());
    const matchGrade = gradeFilter === 'All Grades' || s.grade === gradeFilter;
    const matchStatus = statusFilter === 'All Statuses' || s.status === statusFilter;
    return matchSearch && matchGrade && matchStatus;
  });

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {isRefreshing && (
        <div className="flex justify-center pb-0">
          <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-indigo-500" />
          <div>
            <h1 className="text-2xl font-bold">Students Register</h1>
            <p className="text-muted-foreground text-sm">{students.length} student{students.length !== 1 ? 's' : ''} enrolled</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/students/import">
            <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-1" /> Import</Button>
          </Link>
          <Link to="/students/register">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <UserPlus className="w-4 h-4 mr-1" /> Add Student
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or admission no..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="text-center py-14 text-muted-foreground space-y-3">
            <Users className="w-10 h-10 mx-auto opacity-30" />
            <p>No students found. {students.length === 0 && <Link to="/students/register" className="text-indigo-600 underline">Register the first student →</Link>}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <Link key={s.id} to={`/students/${s.id}`}>
              <Card className="border-border/50 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {s.photo_url
                      ? <img src={s.photo_url} alt={s.first_name} className="w-full h-full object-cover" />
                      : <UserCircle className="w-7 h-7 text-indigo-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{s.first_name} {s.last_name}</p>
                    <p className="text-xs text-muted-foreground">{s.admission_number || 'No Adm#'} · {s.grade}</p>
                    <Badge className={`mt-1 text-xs ${statusColor(s.status)}`}>{s.status || 'Active'}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}