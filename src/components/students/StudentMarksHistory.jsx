import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, MessageSquare } from 'lucide-react';
import { getBand, bandColor } from '@/utils/bands';
import { ALL_SUBJECTS } from '@/utils/gradeSubjects';
import SmsNotifyModal from '@/components/marks/SmsNotifyModal';

const DEFAULT_SUBJECTS = [
  { key: 'mathematics', label: 'Mathematics' },
  { key: 'english', label: 'English' },
  { key: 'kiswahili', label: 'Kiswahili' },
  { key: 'integrated_science', label: 'Integrated Science' },
  { key: 'agriculture', label: 'Agriculture' },
  { key: 'social_studies', label: 'Social Studies' },
  { key: 'pretechnical_studies', label: 'Pre-Technical Studies' },
  { key: 'religious_studies', label: 'Religious Studies' },
  { key: 'creative_art', label: 'Creative Art' },
];

function getSubjectsForRecord(rec) {
  if (rec.subjects_config && rec.subjects_config.length > 0) {
    return rec.subjects_config.map(k => ALL_SUBJECTS.find(s => s.key === k)).filter(Boolean);
  }
  return DEFAULT_SUBJECTS;
}

function getTotal(record, subjects) {
  return subjects.reduce((sum, s) => sum + (Number(record[s.key]) || 0), 0);
}

const bandBadgeColor = (band) => {
  if (!band) return 'bg-muted text-muted-foreground';
  const b = band.toUpperCase();
  if (b.startsWith('EE')) return 'bg-green-100 text-green-700';
  if (b.startsWith('ME')) return 'bg-blue-100 text-blue-700';
  if (b.startsWith('AE')) return 'bg-amber-100 text-amber-700';
  if (b.startsWith('BE')) return 'bg-red-100 text-red-700';
  return 'bg-muted text-muted-foreground';
};

export default function StudentMarksHistory({ marksRecords = [], student }) {
  const [smsModal, setSmsModal] = useState(null);

  if (marksRecords.length === 0) return (
    <Card className="border-border/50">
      <CardContent className="text-center py-10 text-muted-foreground">
        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No marks recorded yet for this student.</p>
      </CardContent>
    </Card>
  );

  const sorted = [...marksRecords].sort((a, b) => {
    const ga = a.grade + a.term + a.exam_type;
    const gb = b.grade + b.term + b.exam_type;
    return ga.localeCompare(gb);
  });

  return (
    <div className="space-y-4">
      {sorted.map((rec) => {
        const subjects = getSubjectsForRecord(rec);
        const total = getTotal(rec, subjects);
        const avg = subjects.length ? (total / subjects.length).toFixed(1) : '0';
        // Build a student object for SmsNotifyModal (it uses student.name and student.parent_phone)
        const modalStudent = student
          ? { ...rec, name: `${student.first_name} ${student.last_name}`, parent_phone: student.parent_phone, parent_name: student.parent_name }
          : { ...rec, name: rec.name || '' };
        const filters = { grade: rec.grade, term: rec.term, exam_type: rec.exam_type };

        return (
          <Card key={rec.id} className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">
                  {rec.grade} · {rec.term} · {rec.exam_type}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Total: <strong>{total}</strong></span>
                  <span className="text-sm text-muted-foreground">Avg: <strong>{avg}</strong></span>
                  {rec.overall_band && (
                    <Badge className={bandBadgeColor(rec.overall_band)}>{rec.overall_band}</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50"
                    onClick={() => setSmsModal({ student: modalStudent, marksData: rec, filters })}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Send to Parent
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/60">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Subject</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">Marks</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">Band</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((s, i) => {
                      const mark = rec[s.key];
                      const band = rec[`${s.key}_band`] || getBand(mark);
                      const hasMark = mark !== null && mark !== undefined && mark !== '';
                      return (
                        <tr key={s.key} className={`border-b border-border/40 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                          <td className="px-3 py-2 font-medium">{s.label}</td>
                          <td className="px-3 py-2 text-center">{hasMark ? mark : '—'}</td>
                          <td className="px-3 py-2 text-center">
                            {band
                              ? <span className="font-bold text-xs" style={{ color: bandColor(band) }}>{band}</span>
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-primary/10 font-bold">
                      <td className="px-3 py-2">Total / Average</td>
                      <td className="px-3 py-2 text-center">{total}</td>
                      <td className="px-3 py-2 text-center">{avg}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <SmsNotifyModal
        open={!!smsModal}
        onOpenChange={(v) => !v && setSmsModal(null)}
        student={smsModal?.student}
        marksData={smsModal?.marksData}
        filters={smsModal?.filters}
      />
    </div>
  );
}