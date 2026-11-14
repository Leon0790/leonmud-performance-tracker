import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, ClipboardList, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import MarksFilters from '../components/marks/MarksFilters';
import MarksTable from '../components/marks/MarksTable';
import SimpleMarksTable from '../components/marks/SimpleMarksTable';
import SubjectPicker from '../components/marks/SubjectPicker';
import AddStudentDialog from '../components/marks/AddStudentDialog';
import { isJuniorSecondary, getDefaultSubjectsForGrade } from '@/utils/gradeSubjects';

export default function MarksEntry() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filters, setFilters] = useState({
    grade: 'Grade 7',
    term: 'Term 1',
    exam_type: 'Mid Term',
  });
  const [subjectPickerConfirmed, setSubjectPickerConfirmed] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Load teacher profile
  const { data: teachers = [] } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: () => base44.entities.Teacher.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const profile = teachers[0] || null;

  // Pre-fill grade from teacher profile
  useEffect(() => {
    if (profile?.class_grade) setFilters(prev => ({ ...prev, grade: profile.class_grade }));
  }, [profile?.class_grade]);

  // When grade changes, load saved subjects or reset picker
  useEffect(() => {
    const grade = filters.grade;
    if (isJuniorSecondary(grade)) {
      setSubjectPickerConfirmed(true);
      setSelectedSubjects([]);
      return;
    }
    // Load from teacher's saved grade_subjects config
    const saved = profile?.grade_subjects?.[grade];
    if (saved && saved.length > 0) {
      setSelectedSubjects(saved);
      setSubjectPickerConfirmed(true);
    } else {
      // Show picker with defaults pre-selected
      setSelectedSubjects(getDefaultSubjectsForGrade(grade));
      setSubjectPickerConfirmed(false);
    }
  }, [filters.grade, profile?.id]);

  // Fetch all students for teacher + grade
  // We fetch by both teacher_email AND created_by to catch students where teacher_email may not have been set
  const { data: studentsByTeacherEmail = [], isLoading: loadingByEmail } = useQuery({
    queryKey: ['students-by-email', filters.grade, user?.email],
    queryFn: () => base44.entities.Student.filter({ teacher_email: user?.email, grade: filters.grade }),
    enabled: !!user?.email,
  });

  const { data: studentsByCreatedBy = [], isLoading: loadingByCreatedBy } = useQuery({
    queryKey: ['students-by-creator', filters.grade, user?.email],
    queryFn: () => base44.entities.Student.filter({ created_by: user?.email, grade: filters.grade }),
    enabled: !!user?.email,
  });

  // Merge and deduplicate by id
  const students = useMemo(() => {
    const map = {};
    [...studentsByTeacherEmail, ...studentsByCreatedBy].forEach(s => { map[s.id] = s; });
    return Object.values(map);
  }, [studentsByTeacherEmail, studentsByCreatedBy]);

  const isLoading = loadingByEmail || loadingByCreatedBy;

  const { data: registerByEmail = [] } = useQuery({
    queryKey: ['register-by-email', user?.email],
    queryFn: () => base44.entities.StudentRegister.filter({ teacher_email: user?.email }),
    enabled: !!user?.email,
  });
  const { data: registerByCreator = [] } = useQuery({
    queryKey: ['register-by-creator', user?.email],
    queryFn: () => base44.entities.StudentRegister.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });
  const registerStudents = useMemo(() => {
    const map = {};
    [...registerByEmail, ...registerByCreator].forEach(s => { map[s.id] = s; });
    return Object.values(map);
  }, [registerByEmail, registerByCreator]);

  const studentRegisterMap = useMemo(() => {
    const map = {};
    registerStudents.forEach(s => { if (s.admission_number) map[s.admission_number] = s; });
    return map;
  }, [registerStudents]);

  // Marks for the selected term/exam, plus names enrolled in the Students Register
  // for this grade that have no marks record yet — so every registered name shows up.
  const filteredStudents = useMemo(() => {
    const inTerm = students.filter(s =>
      s.term === filters.term &&
      s.exam_type === filters.exam_type
    );

    const admissionSet = new Set(
      inTerm.map(s => (s.admission_number || '').trim().toLowerCase()).filter(Boolean)
    );
    const nameSet = new Set(
      inTerm.map(s => (s.name || '').trim().toLowerCase()).filter(Boolean)
    );

    const fromRegister = registerStudents
      .filter(r => r.grade === filters.grade)
      .filter(r => {
        const admission = (r.admission_number || '').trim().toLowerCase();
        const name = `${r.first_name || ''} ${r.last_name || ''}`.trim().toLowerCase();
        if (admission && admissionSet.has(admission)) return false;
        if (name && nameSet.has(name)) return false;
        return !!name;
      })
      .map(r => ({
        id: `reg:${r.id}`,
        _virtual: true,
        name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        admission_number: r.admission_number || '',
        grade: r.grade,
        term: filters.term,
        exam_type: filters.exam_type,
      }));

    return [...inTerm, ...fromRegister];
  }, [students, registerStudents, filters.grade, filters.term, filters.exam_type]);

  // Add new student
  const addMutation = useMutation({
    mutationFn: async (data) => {
      // Ensure teacher_email, grade, term, exam_type are attached
      const payload = {
        ...data,
        teacher_email: user?.email,
        grade: filters.grade,
        term: filters.term,
        exam_type: filters.exam_type,
      };
      return base44.entities.Student.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-by-email'] });
      queryClient.invalidateQueries({ queryKey: ['students-by-creator'] });
      setShowAddDialog(false);
      toast({ title: 'Student added!' });
    },
    onError: (err) => {
      toast({ title: 'Error adding student', description: err.message });
    }
  });

  // Update student marks (with optimistic update)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // A row that only exists in the Students Register — create its marks record now
      if (typeof id === 'string' && id.startsWith('reg:')) {
        const registerId = id.slice(4);
        const reg = registerStudents.find(r => r.id === registerId);
        return base44.entities.Student.create({
          name: `${reg?.first_name || ''} ${reg?.last_name || ''}`.trim(),
          admission_number: reg?.admission_number || '',
          grade: filters.grade,
          term: filters.term,
          exam_type: filters.exam_type,
          teacher_email: user?.email,
          ...data,
        });
      }
      return base44.entities.Student.update(id, data);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['students-by-email'] });
      await queryClient.cancelQueries({ queryKey: ['students-by-creator'] });
      const prevByEmail = queryClient.getQueryData(['students-by-email', filters.grade, user?.email]);
      const prevByCreator = queryClient.getQueryData(['students-by-creator', filters.grade, user?.email]);
      const patcher = (old) => old?.map(s => s.id === id ? { ...s, ...data } : s) ?? old;
      queryClient.setQueryData(['students-by-email', filters.grade, user?.email], patcher);
      queryClient.setQueryData(['students-by-creator', filters.grade, user?.email], patcher);
      return { prevByEmail, prevByCreator };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevByEmail) queryClient.setQueryData(['students-by-email', filters.grade, user?.email], context.prevByEmail);
      if (context?.prevByCreator) queryClient.setQueryData(['students-by-creator', filters.grade, user?.email], context.prevByCreator);
      toast({ title: 'Failed to save marks', description: 'Changes rolled back.' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-by-email'] });
      queryClient.invalidateQueries({ queryKey: ['students-by-creator'] });
      toast({ title: 'Marks saved!' });
    },
  });

  // Save subject config for grade to teacher profile
  const saveSubjectsMutation = useMutation({
    mutationFn: async (subjects) => {
      const existing = profile?.grade_subjects || {};
      const updated = { ...existing, [filters.grade]: subjects };
      if (profile) {
        return base44.entities.Teacher.update(profile.id, { grade_subjects: updated });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-profile'] });
      setSubjectPickerConfirmed(true);
    },
  });

  const handleConfirmSubjects = () => {
    saveSubjectsMutation.mutate(selectedSubjects);
  };

  // Delete student
  const deleteMutation = useMutation({
    mutationFn: (id) => {
      if (typeof id === 'string' && id.startsWith('reg:')) return null;
      return base44.entities.Student.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-by-email'] });
      queryClient.invalidateQueries({ queryKey: ['students-by-creator'] });
      toast({ title: 'Student deleted.' });
    },
  });

  if (userLoading) return <div>Loading...</div>;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary" /> Marks Entry
          </h1>
          <p className="text-muted-foreground mt-1">
            {profile?.full_name && <span className="text-primary font-semibold">{profile.full_name}</span>}
            {profile?.class_grade && ` · ${profile.class_grade}`}
            {profile?.class_name && ` ${profile.class_name}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/marks/import">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" /> Import CSV
            </Button>
          </Link>
          <Button onClick={() => setShowAddDialog(true)}>
            <UserPlus className="w-4 h-4 mr-2" /> Add Student
          </Button>
        </div>
      </div>

      <Card className="shadow-md border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Select Class & Exam</CardTitle>
        </CardHeader>
        <CardContent>
          <MarksFilters filters={filters} onChange={setFilters} />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : isJuniorSecondary(filters.grade) ? (
        <MarksTable
          students={filteredStudents}
          onUpdateMarks={(id, data) => updateMutation.mutate({ id, data })}
          onDelete={(id) => deleteMutation.mutate(id)}
          isSaving={updateMutation.isPending}
          filters={filters}
          studentRegisterMap={studentRegisterMap}
        />
      ) : !subjectPickerConfirmed ? (
        <SubjectPicker
          grade={filters.grade}
          selected={selectedSubjects}
          onChange={setSelectedSubjects}
          onConfirm={handleConfirmSubjects}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setSubjectPickerConfirmed(false)}
              className="text-xs text-primary font-medium hover:underline"
            >
              ✏️ Change subjects for {filters.grade}
            </button>
          </div>
          <SimpleMarksTable
            students={filteredStudents}
            subjectKeys={selectedSubjects}
            onUpdateMarks={(id, data) => updateMutation.mutate({ id, data })}
            onDelete={(id) => deleteMutation.mutate(id)}
            isSaving={updateMutation.isPending}
            studentRegisterMap={studentRegisterMap}
            filters={filters}
          />
        </div>
      )}

      <AddStudentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={(data) => addMutation.mutate(data)}
        isAdding={addMutation.isPending}
      />
    </div>
  );
}