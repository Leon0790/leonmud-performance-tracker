import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WelcomeAnimation from '../components/dashboard/WelcomeAnimation';
import TeacherProfileCard from '../components/dashboard/TeacherProfileCard';
import StatsOverview from '../components/dashboard/StatsOverview';
import QuickStatsCards from '../components/dashboard/QuickStatsCards';
import SubjectBarChart from '../components/dashboard/SubjectBarChart';
import { useToast } from '@/components/ui/use-toast';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';

const SUBJECTS = [
  'mathematics', 'english', 'kiswahili', 'integrated_science',
  'agriculture', 'social_studies', 'pretechnical_studies',
  'religious_studies', 'creative_art'
];

function getTotal(student) {
  return SUBJECTS.reduce((t, sub) => t + (Number(student[sub]) || 0), 0);
}

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { containerRef, isRefreshing } = usePullToRefresh(async () => {
    await queryClient.invalidateQueries();
  });

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

  const { data: students = [] } = useQuery({
    queryKey: ['all-students', user?.email],
    queryFn: () => base44.entities.Student.filter({ teacher_email: user?.email }),
    enabled: !!user?.email,
  });

  const [onSaveCallback, setOnSaveCallback] = useState(null);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (profile) {
        return base44.entities.Teacher.update(profile.id, data);
      }
      return base44.entities.Teacher.create(data);
    },
    onSuccess: (savedProfile) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-profile'] });
      toast({ title: 'Profile saved successfully!' });
      if (onSaveCallback) {
        onSaveCallback(savedProfile);
        setOnSaveCallback(null);
      }
    },
  });

  const avgScore = students.length > 0
    ? students.reduce((sum, s) => sum + getTotal(s) / SUBJECTS.length, 0) / students.length
    : 0;

  const topStudent = students.length > 0
    ? [...students].sort((a, b) => getTotal(b) - getTotal(a))[0]
    : null;

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {isRefreshing && (
        <div className="flex justify-center pt-2 pb-0">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      <WelcomeAnimation teacherName={profile?.full_name || user?.full_name} />

      <QuickStatsCards
        studentCount={students.length}
        avgScore={avgScore}
        topStudentName={topStudent?.name}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <TeacherProfileCard
            profile={profile}
            onSave={(data, cb) => {
              setOnSaveCallback(() => cb);
              saveMutation.mutate(data);
            }}
            isSaving={saveMutation.isPending}
          />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <StatsOverview studentCount={students.length} avgScore={avgScore} />
          <SubjectBarChart students={students} />
        </div>
      </div>
    </div>
  );
}