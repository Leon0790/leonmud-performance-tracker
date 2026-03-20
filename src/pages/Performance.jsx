import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import MarksFilters from '../components/marks/MarksFilters';
import LearnerGraph from '../components/performance/LearnerGraph';
import ClassGraph from '../components/performance/ClassGraph';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Performance() {
  const [filters, setFilters] = useState({
    grade: 'Grade 7',
    term: 'Term 1',
    exam_type: 'Mid Term',
  });
  const [selectedStudent, setSelectedStudent] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['perf-students', filters, user?.email],
    queryFn: () => base44.entities.Student.filter({
      teacher_email: user?.email,
      grade: filters.grade,
      term: filters.term,
      exam_type: filters.exam_type,
    }),
    enabled: !!user?.email,
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-primary" />
          Performance Analysis
        </h1>
        <p className="text-muted-foreground mt-1">View learner and class performance trends</p>
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <LearnerGraph
            students={students}
            selectedStudent={selectedStudent}
            onSelectStudent={setSelectedStudent}
          />
          <ClassGraph students={students} />
        </div>
      )}
    </div>
  );
}