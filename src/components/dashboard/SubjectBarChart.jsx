import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SUBJECTS = [
  { key: 'mathematics', label: 'Maths' },
  { key: 'english', label: 'Eng' },
  { key: 'kiswahili', label: 'Kisw' },
  { key: 'integrated_science', label: 'Sci' },
  { key: 'agriculture', label: 'Agri' },
  { key: 'social_studies', label: 'S.St' },
  { key: 'pretechnical_studies', label: 'P.Tech' },
  { key: 'religious_studies', label: 'CRE' },
  { key: 'creative_art', label: 'Art' },
];

const COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316','#84cc16','#ec4899'];

export default function SubjectBarChart({ students }) {
  if (!students.length) return null;

  const data = SUBJECTS.map((s, i) => {
    const scores = students.map(st => Number(st[s.key]) || 0).filter(v => v > 0);
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
    return { name: s.label, avg: Number(avg), color: COLORS[i] };
  });

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Subject Averages</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => [`${v}`, 'Avg']} />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}