import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, BookOpen, Award } from 'lucide-react';

export default function QuickStatsCards({ studentCount, avgScore, topSubject, topStudentName }) {
  const stats = [
    {
      label: 'Total Students',
      value: studentCount,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
    },
    {
      label: 'Class Average',
      value: avgScore > 0 ? `${avgScore.toFixed(1)}%` : '—',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800',
    },
    {
      label: 'Learning Areas',
      value: '9',
      icon: BookOpen,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      border: 'border-purple-200 dark:border-purple-800',
    },
    {
      label: 'Top Performer',
      value: topStudentName || '—',
      icon: Award,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      small: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className={`rounded-xl border p-4 ${s.bg} ${s.border} flex items-center gap-3`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.bg} shrink-0`}>
            <s.icon className={`w-5 h-5 ${s.color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`font-bold ${s.small ? 'text-sm truncate' : 'text-xl'} ${s.color}`}>{s.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}