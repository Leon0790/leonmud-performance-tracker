import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { TrendingUp, BarChart2, Activity } from 'lucide-react';

const SUBJECTS = [
  { key: 'mathematics', label: 'Maths', color: '#6366f1' },
  { key: 'english', label: 'English', color: '#0ea5e9' },
  { key: 'kiswahili', label: 'Kiswahili', color: '#10b981' },
  { key: 'integrated_science', label: 'Science', color: '#f59e0b' },
  { key: 'agriculture', label: 'Agric', color: '#84cc16' },
  { key: 'social_studies', label: 'Social', color: '#ec4899' },
  { key: 'pretechnical_studies', label: 'PreTech', color: '#8b5cf6' },
  { key: 'religious_studies', label: 'CRE', color: '#f97316' },
  { key: 'creative_art', label: 'Art', color: '#14b8a6' },
];

const BAND_ORDER = ['EE1', 'EE2', 'ME1', 'ME2', 'AE1', 'AE2', 'BE1', 'BE2'];
const bandToScore = (band) => {
  const idx = BAND_ORDER.indexOf(band);
  return idx === -1 ? null : 8 - idx; // EE1=8 (best), BE2=1 (lowest)
};

function examLabel(rec) {
  const termShort = rec.term?.replace('Term ', 'T');
  const examShort = rec.exam_type === 'Mid Term' ? 'Mid' : 'End';
  return `${rec.grade?.replace('Grade ', 'G')} ${termShort} ${examShort}`;
}

function getTotal(rec) {
  return SUBJECTS.reduce((sum, s) => sum + (Number(rec[s.key]) || 0), 0);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs max-w-[200px]">
      <p className="font-bold mb-1 text-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-3">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-semibold">{p.value ?? '—'}</span>
        </div>
      ))}
    </div>
  );
};

export default function StudentPerformanceCharts({ marksRecords }) {
  const [activeSubjects, setActiveSubjects] = useState(
    SUBJECTS.slice(0, 4).map(s => s.key)
  );

  if (!marksRecords || marksRecords.length === 0) return null;

  const sorted = [...marksRecords].sort((a, b) =>
    (a.grade + a.term + a.exam_type).localeCompare(b.grade + b.term + b.exam_type)
  );

  // ── Line chart: subject scores over time ──
  const trendData = sorted.map(rec => {
    const row = { exam: examLabel(rec), total: getTotal(rec) };
    SUBJECTS.forEach(s => {
      const v = rec[s.key];
      row[s.key] = v !== '' && v !== null && v !== undefined ? Number(v) : null;
    });
    return row;
  });

  // ── Radar: latest exam subject breakdown ──
  const latest = sorted[sorted.length - 1];
  const radarData = SUBJECTS.map(s => ({
    subject: s.label,
    mark: Number(latest[s.key]) || 0,
  }));

  // ── Overall total trend ──
  const totalTrend = sorted.map(rec => ({
    exam: examLabel(rec),
    total: getTotal(rec),
    avg: +(getTotal(rec) / SUBJECTS.length).toFixed(1),
  }));

  const toggleSubject = (key) => {
    setActiveSubjects(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="space-y-5">
      {/* Total Score Trend */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Overall Score Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={totalTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="exam" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 900]} tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="total" name="Total Score" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
              <Line type="monotone" dataKey="avg" name="Average" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Subject Score Trends */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Subject Score Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Subject toggle pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {SUBJECTS.map(s => (
              <button
                key={s.key}
                onClick={() => toggleSubject(s.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  activeSubjects.includes(s.key)
                    ? 'text-white border-transparent'
                    : 'bg-transparent border-border text-muted-foreground'
                }`}
                style={activeSubjects.includes(s.key) ? { backgroundColor: s.color, borderColor: s.color } : {}}
              >
                {s.label}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="exam" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              {SUBJECTS.filter(s => activeSubjects.includes(s.key)).map(s => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Latest Exam Radar + Bar side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" /> Latest Exam Breakdown
            </CardTitle>
            <p className="text-xs text-muted-foreground">{examLabel(latest)}</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={radarData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="subject" tick={{ fontSize: 10 }} width={58} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="mark" name="Mark" radius={[0, 4, 4, 0]}>
                  {radarData.map((_, i) => (
                    <Cell key={i} fill={SUBJECTS[i]?.color || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Subject Radar
            </CardTitle>
            <p className="text-xs text-muted-foreground">{examLabel(latest)}</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
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