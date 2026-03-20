import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const SUBJECTS = [
  { key: 'mathematics', label: 'Mathematics' },
  { key: 'english', label: 'English' },
  { key: 'kiswahili', label: 'Kiswahili' },
  { key: 'integrated_science', label: 'Int. Science' },
  { key: 'agriculture', label: 'Agriculture' },
  { key: 'social_studies', label: 'Social Studies' },
  { key: 'pretechnical_studies', label: 'Pre-Tech' },
  { key: 'religious_studies', label: 'Religious' },
  { key: 'creative_art', label: 'Creative Art' },
];

const COLORS = [
  'hsl(204, 70%, 40%)', 'hsl(160, 60%, 40%)', 'hsl(30, 80%, 55%)',
  'hsl(280, 60%, 55%)', 'hsl(340, 70%, 50%)', 'hsl(50, 70%, 45%)',
  'hsl(120, 50%, 40%)', 'hsl(0, 60%, 50%)', 'hsl(220, 50%, 60%)',
];

export default function LearnerGraph({ students, selectedStudent, onSelectStudent }) {
  const student = students.find((s) => s.id === selectedStudent);

  const chartData = student
    ? SUBJECTS.map(({ key, label }) => ({
        subject: label,
        marks: student[key] || 0,
      }))
    : [];

  return (
    <Card className="shadow-md border-border/50">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg">Learner Performance</CardTitle>
          <Select value={selectedStudent || ''} onValueChange={onSelectStudent}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {student ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(204, 20%, 85%)" />
              <XAxis dataKey="subject" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={70} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="marks" stroke={COLORS[0]} strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} name="Marks" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-12">Select a student to view performance</p>
        )}
      </CardContent>
    </Card>
  );
}