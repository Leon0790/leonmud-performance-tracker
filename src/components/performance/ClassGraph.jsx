import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

export default function ClassGraph({ students }) {
  const chartData = SUBJECTS.map(({ key, label }) => {
    const scores = students.map((s) => s[key] || 0).filter((v) => v > 0);
    const mean = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { subject: label, mean: parseFloat(mean.toFixed(1)) };
  });

  return (
    <Card className="shadow-md border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Class Mean Scores by Subject</CardTitle>
      </CardHeader>
      <CardContent>
        {students.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(204, 20%, 85%)" />
              <XAxis dataKey="subject" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={70} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="mean" stroke="hsl(160, 60%, 40%)" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} name="Class Mean" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-12">No data available yet</p>
        )}
      </CardContent>
    </Card>
  );
}