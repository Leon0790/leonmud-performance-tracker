import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, ClipboardList, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import MarksFilters from '../components/marks/MarksFilters';
import MarksTable from '../components/marks/MarksTable';
import AddStudentDialog from '../components/marks/AddStudentDialog';

export default function MarksEntry() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filters, setFilters] = useState({
    grade: 'Grade 7',
    term: 'Term 1',
    exam_type: 'Mid Term',
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: teachers = [], isLoading: isLoadingProfile } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: () => base44.entities.Teacher.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const profile = teachers[0] || null;

  // Pre-fill grade from teacher profile once loaded
  useEffect(() => {
    if (profile?.class_grade) {
      setFilters((prev) => ({ ...prev, grade: profile.class_grade }));
    }
  }, [profile?.class_grade]);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', filters, user?.email],
    queryFn: () => base44.entities.Student.filter({
      teacher_email: user?.email,
      grade: filters.grade,
      term: filters.term,
      exam_type: filters.exam_type,
    }),
    enabled: !!user?.email,
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.Student.create({
      ...data,
      grade: filters.grade,
      term: filters.term,
      exam_type: filters.exam_type,
      teacher_email: user.email,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['all-students'] });
      setShowAddDialog(false);
      toast({ title: 'Student added!' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Student.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['all-students'] });
      toast({ title: 'Marks saved!' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Student.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['all-students'] });
      toast({ title: 'Student deleted.' });
    },
  });

  

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary" />
            Marks Entry
          </h1>
          <p className="text-muted-foreground mt-1">
            {profile?.full_name && <span className="text-primary font-semibold">{profile.full_name}</span>}
            {profile?.class_grade && ` · ${profile.class_grade}`}
            {profile?.class_name && ` ${profile.class_name}`}
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
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
      ) : (
        <MarksTable
          students={students}
          onUpdateMarks={(id, data) => updateMutation.mutate({ id, data })}
          onDelete={(id) => deleteMutation.mutate(id)}
          isSaving={updateMutation.isPending}
        />
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