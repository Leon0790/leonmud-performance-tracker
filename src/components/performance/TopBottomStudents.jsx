import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

const SUBJECTS = ['mathematics','english','kiswahili','integrated_science','agriculture','social_studies','pretechnical_studies','religious_studies','creative_art'];

function getTotal(s) {
  return SUBJECTS.reduce((sum, k) => sum + (Number(s[k]) || 0), 0);
}

export default function TopBottomStudents({ students }) {
  if (!students.length) return null;

  const sorted = [...students].sort((a, b) => getTotal(b) - getTotal(a));
  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5).reverse();

  const Section = ({ title, data, icon: Icon, color, bg, border }) => (
    <Card className={`border ${border} ${bg}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm flex items-center gap-2 ${color}`}>
          <Icon className="w-4 h-4" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {data.map((s, i) => {
          const total = getTotal(s);
          const avg = (total / SUBJECTS.length).toFixed(1);
          return (
            <div key={s.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-muted text-muted-foreground'
                }`}>{i + 1}</span>
                <span className="text-sm font-medium truncate">{s.name}</span>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-sm font-bold ${color}`}>{avg}</span>
                <span className="text-xs text-muted-foreground ml-1">avg</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Section title="Top 5 Students" data={top5} icon={TrendingUp} color="text-green-600" bg="bg-green-50/50 dark:bg-green-950/20" border="border-green-200 dark:border-green-800" />
      <Section title="Needs Support" data={bottom5} icon={TrendingDown} color="text-red-600" bg="bg-red-50/50 dark:bg-red-950/20" border="border-red-200 dark:border-red-800" />
    </div>
  );
}