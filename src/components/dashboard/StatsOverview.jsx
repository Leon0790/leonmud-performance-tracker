import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, BookOpen, Trophy, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatsOverview({ studentCount, avgScore }) {
  const stats = [
    { label: 'Total Students', value: studentCount, icon: Users, color: 'text-primary' },
    { label: 'Learning Areas', value: 9, icon: BookOpen, color: 'text-chart-2' },
    { label: 'Class Average', value: avgScore ? `${avgScore.toFixed(1)}%` : '--', icon: TrendingUp, color: 'text-chart-3' },
    { label: 'Top Score', value: studentCount > 0 ? 'View' : '--', icon: Trophy, color: 'text-chart-4' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * i, duration: 0.4 }}
        >
          <Card className="shadow-md hover:shadow-lg transition-shadow border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}