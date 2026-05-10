import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine,
} from 'recharts';
import { TrendingUp, BarChart2, Activity, Target } from 'lucide-react';
import { ALL_SUBJECTS } from '@/utils/gradeSubjects';

// A rich palette for up to ~18 subjects
const PALETTE = [
  '#6366f1','#0ea5e9','#10b981','#f59e0b','#84cc16',
  '#ec4899','#8b5cf6','#f97316','#14b8a6','#e11d48',
  '#0284c7','#16a34a','#d97706','#7c3aed','#db2777',
  '#059669','#dc2626','#2563eb',
];

function examLabel(rec) {
  const t = rec.term?.replace('Term ', 'T') || '';
  const e = rec.exam_type === 'Mid Term' ? 'Mid' : 'End';
  return `${t} ${e}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs max-w-[220px]">
      <p className="font-bold mb-1.5 text-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4 py-0.5">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-semibold">{p.value != null ? p.value : '—'}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Detects which subjects actually have any marks in the records,
 * cross-referenced with the ALL_SUBJECTS registry for labels/colors.
 */
function detectSubjects(records) {
  const found = [];
  ALL_SUBJECTS.forEach((subj, idx) => {
    const hasData = records.some(r => {
      const v = r[subj.key];
      return v !== null && v !== undefined && v !== '' && Number(v) > 0;
    });
    if (hasData) {
      found.push({ ...subj, color: PALETTE[found.length % PALETTE.length] });
    }
  });
  return found;
}

export default function StudentPerformanceCharts({ marksRecords }) {
  const sorted = useMemo(() =>
    [...(marksRecords || [])].sort((a, b) =>
      (a.grade + a.term + a.exam_type).localeCompare(b.grade + b.term + b.exam_type)
    ), [marksRecords]);

  const subjects = useMemo(() => detectSubjects(sorted), [sorted]);

  const [activeSubjects, setActiveSubjects] = useState(null); // null = show all

  if (!sorted.length || !subjects.length) return null;

  const visibleSubjects = activeSubjects
    ? subjects.filter(s => activeSubjects.includes(s.key))
    : subjects;

  const toggleSubject = (key) => {
    setActiveSubjects(prev => {
      const all = subjects.map(s => s.key);
      const current = prev ?? all;
      if (current.includes(key)) {
        const next = current.filter(k => k !== key);
        return next.length ? next : all; // never empty
      }
      return [...current, key];
    });
  };

  // ── Trend data: one row per exam ──
  const trendData = sorted.map(rec => {
    const row = { exam: examLabel(rec) };
    subjects.forEach(s => {
      const v = rec[s.key];
      row[s.key] = v !== null && v !== undefined && v !== '' ? Number(v) : null;
    });
    // Overall total & mean
    const vals = subjects.map(s => row[s.key]).filter(v => v != null);
    row._total = vals.reduce((a, b) => a + b, 0);
    row._mean = vals.length ? +(row._total / vals.length).toFixed(1) : null;
    return row;
  });

  // ── Latest exam breakdown (bar + radar) ──
  const latest = sorted[sorted.length - 1];
  const latestLabel = examLabel(latest);
  const latestBarData = subjects.map(s => ({
    subject: s.label,
    mark: Number(latest[s.key]) || 0,
    color: s.color,
  }));

  // ── Per-subject comparison across exams ──
  const subjectCompareData = subjects.map(s => {
    const row = { subject: s.label };
    sorted.forEach(rec => {
      const v = rec[s.key];
      row[examLabel(rec)] = v !== null && v !== undefined && v !== '' ? Number(v) : null;
    });
    return row;
  });

  const examKeys = sorted.map(examLabel);
  const examColors = ['#6366f1','#10b981','#f59e0b','#ec4899','#0ea5e9','#8b5cf6'];

  return (
    <div className="space-y-5">

      {/* ── 1. Overall Mean Trend ── */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Overall Score Trend
          </CardTitle>
          <p className="text-xs text-muted-foreground">Mean score across all learning areas per exam period</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="exam" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={40} stroke="#f87171" strokeDasharray="4 4" label={{ value: 'Pass (40)', position: 'right', fontSize: 9, fill: '#f87171' }} />
              <ReferenceLine y={80} stroke="#4ade80" strokeDasharray="4 4" label={{ value: 'EE (80)', position: 'right', fontSize: 9, fill: '#4ade80' }} />
              <Line type="monotone" dataKey="_mean" name="Mean Score" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 5 }} activeDot={{ r: 7 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── 2. Subject Score Trends (multi-line with toggle) ── */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Learning Area Trends
          </CardTitle>
          <p className="text-xs text-muted-foreground">Click subjects to show/hide</p>
        </CardHeader>
        <CardContent>
          {/* Subject toggle pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {subjects.map(s => {
              const isActive = !activeSubjects || activeSubjects.includes(s.key);
              return (
                <button
                  key={s.key}
                  onClick={() => toggleSubject(s.key)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    isActive ? 'text-white border-transparent' : 'bg-transparent border-border text-muted-foreground opacity-50'
                  }`}
                  style={isActive ? { backgroundColor: s.color, borderColor: s.color } : {}}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData} margin={{ top: 5, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="exam" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={40} stroke="#f87171" strokeDasharray="4 4" />
              {visibleSubjects.map(s => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── 3. Subject × Exam Grouped Bar (compare exams per subject) ── */}
      {sorted.length > 1 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Exam-to-Exam Comparison by Subject
            </CardTitle>
            <p className="text-xs text-muted-foreground">Side-by-side bars show progress across exam periods</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={subjects.length > 6 ? 300 : 240}>
              <BarChart data={subjectCompareData} layout="vertical" margin={{ top: 0, right: 16, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="subject" tick={{ fontSize: 9 }} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {examKeys.map((key, i) => (
                  <Bar key={key} dataKey={key} name={key} fill={examColors[i % examColors.length]} radius={[0, 3, 3, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── 4. Latest Exam: Horizontal bar breakdown ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" /> Latest Exam Breakdown
            </CardTitle>
            <p className="text-xs text-muted-foreground">{latestLabel}</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(180, subjects.length * 28)}>
              <BarChart data={latestBarData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="subject" tick={{ fontSize: 9 }} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x={40} stroke="#f87171" strokeDasharray="4 4" />
                <Bar dataKey="mark" name="Mark" radius={[0, 4, 4, 0]}>
                  {latestBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── 5. Radar ── */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Subject Radar
            </CardTitle>
            <p className="text-xs text-muted-foreground">{latestLabel}</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={latestBarData.map(d => ({ subject: d.subject, mark: d.mark }))}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 7 }} />
                <Radar name="Score" dataKey="mark" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}