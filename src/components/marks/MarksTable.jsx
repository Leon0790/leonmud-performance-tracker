import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Save, SaveAll, MessageSquare } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getBand, bandTailwindColor } from '@/utils/bands';
import SmsNotifyModal from './SmsNotifyModal';

// Subjects with simple single-mark entry (no papers)
const SIMPLE_SUBJECTS = [
  { key: 'mathematics', label: 'Maths', max: 100 },
  { key: 'agriculture', label: 'Agri.', max: 100 },
  { key: 'social_studies', label: 'S.Studies', max: 100 },
  { key: 'pretechnical_studies', label: 'Pre-Tech', max: 100 },
  { key: 'religious_studies', label: 'Religious', max: 100 },
  { key: 'creative_art', label: 'Art', max: 100 },
];

// Subjects with paper breakdown
const PAPER_SUBJECTS = [
  {
    key: 'kiswahili',
    label: 'Kiswahili',
    papers: [
      { pkey: 'kiswahili_p1', label: 'P1', max: 50 },
      { pkey: 'kiswahili_p2', label: 'P2', max: 50 },
    ],
  },
  {
    key: 'english',
    label: 'English',
    papers: [
      { pkey: 'english_p1', label: 'P1', max: 50 },
      { pkey: 'english_p2', label: 'P2', max: 50 },
    ],
  },
  {
    key: 'integrated_science',
    label: 'Int. Science',
    papers: [
      { pkey: 'integrated_science_p1', label: 'P1', max: 70 },
      { pkey: 'integrated_science_p2', label: 'P2', max: 30 },
    ],
  },
];

function calcPaperTotal(marks, subject) {
  return subject.papers.reduce((sum, p) => sum + (parseInt(marks[p.pkey]) || 0), 0);
}

const NUM_SUBJECTS = PAPER_SUBJECTS.length + SIMPLE_SUBJECTS.length;

function calcOverallTotal(marks) {
  const paperTotal = PAPER_SUBJECTS.reduce((sum, s) => sum + calcPaperTotal(marks, s), 0);
  const simpleTotal = SIMPLE_SUBJECTS.reduce((sum, s) => sum + (parseInt(marks[s.key]) || 0), 0);
  return paperTotal + simpleTotal;
}

function calcMean(marks) {
  const total = calcOverallTotal(marks);
  return (total / NUM_SUBJECTS).toFixed(1);
}

function colAvg(allMarks, studentIds, getter) {
  const vals = studentIds.map(id => getter(allMarks[id] || {})).filter(v => v !== '' && !isNaN(v) && Number(v) > 0);
  if (!vals.length) return '—';
  return (vals.reduce((s, v) => s + Number(v), 0) / vals.length).toFixed(1);
}

function BandBadge({ score }) {
  const band = getBand(score);
  if (!band) return <span className="text-muted-foreground text-xs">—</span>;
  const cls = bandTailwindColor(band);
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${cls}`}>
      {band}
    </span>
  );
}

function PaperInput({ value, max, onChange }) {
  const num = value === '' ? '' : parseInt(value) || 0;
  const isOver = num !== '' && num > max;
  return (
    <Input
      type="number"
      min="0"
      max={max}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={`w-16 h-7 text-center text-xs mx-auto ${isOver ? 'border-orange-400 bg-orange-50' : ''}`}
    />
  );
}

function findRegisterInfo(student, studentRegisterMap) {
  if (student.admission_number && studentRegisterMap?.[student.admission_number]) {
    return studentRegisterMap[student.admission_number];
  }
  if (!studentRegisterMap) return {};
  const studentName = (student.name || '').trim().toLowerCase();
  const match = Object.values(studentRegisterMap).find(r => {
    const regName = `${r.first_name || ''} ${r.last_name || ''}`.trim().toLowerCase();
    return regName === studentName;
  });
  return match || {};
}

export default function MarksTable({ students, onUpdateMarks, onDelete, isSaving, filters, studentRegisterMap }) {
  const [marks, setMarks] = useState({});
  const [dirtyStudents, setDirtyStudents] = useState(new Set());
  const [smsModal, setSmsModal] = useState(null); // { student, marksData }

  useEffect(() => {
    const init = {};
    students.forEach((s) => {
      init[s.id] = {};
      // Paper subjects — load paper fields + total
      PAPER_SUBJECTS.forEach(({ key, papers }) => {
        papers.forEach(({ pkey }) => { init[s.id][pkey] = s[pkey] ?? ''; });
        init[s.id][key] = s[key] ?? '';
      });
      // Simple subjects
      SIMPLE_SUBJECTS.forEach(({ key }) => { init[s.id][key] = s[key] ?? ''; });
    });
    setMarks(init);
    setDirtyStudents(new Set());
  }, [students]);

  const setMark = (studentId, field, rawValue, max) => {
    const clamped = rawValue === '' ? '' : Math.min(max, Math.max(0, parseInt(rawValue) || 0));
    setMarks((prev) => {
      const updated = { ...prev[studentId], [field]: clamped };
      // Recalc paper totals when a paper field changes
      PAPER_SUBJECTS.forEach((s) => {
        if (s.papers.some((p) => p.pkey === field)) {
          updated[s.key] = s.papers.reduce((sum, p) => sum + (parseInt(p.pkey === field ? clamped : updated[p.pkey]) || 0), 0);
        }
      });
      return { ...prev, [studentId]: updated };
    });
    setDirtyStudents((prev) => new Set([...prev, studentId]));
  };

  const handleSave = (studentId) => {
    const m = marks[studentId] || {};
    const data = {};
    PAPER_SUBJECTS.forEach(({ key, papers }) => {
      papers.forEach(({ pkey }) => { data[pkey] = m[pkey] === '' ? null : parseInt(m[pkey]) || 0; });
      data[key] = m[key] === '' ? null : parseInt(m[key]) || 0;
      data[`${key}_band`] = getBand(data[key]);
    });
    SIMPLE_SUBJECTS.forEach(({ key }) => {
      data[key] = m[key] === '' ? null : parseInt(m[key]) || 0;
      data[`${key}_band`] = getBand(data[key]);
    });
    const overall = calcOverallTotal(m);
    data.overall_band = getBand(overall / (PAPER_SUBJECTS.length + SIMPLE_SUBJECTS.length));
    onUpdateMarks(studentId, data);
    setDirtyStudents((prev) => { const n = new Set(prev); n.delete(studentId); return n; });
  };

  const handleSaveAll = () => dirtyStudents.forEach((id) => handleSave(id));

  const rankedStudents = [...students]
    .map((s) => ({ ...s, _total: calcOverallTotal(marks[s.id] || {}) }))
    .sort((a, b) => b._total - a._total)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  if (students.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">No students yet. Add students to start entering marks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dirtyStudents.size > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSaveAll} disabled={isSaving} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
            <SaveAll className="w-4 h-4" /> Save All ({dirtyStudents.size} unsaved)
          </Button>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            {/* Row 1 — subject group headers */}
            <TableRow className="bg-primary/10">
              <TableHead rowSpan={2} className="font-bold text-foreground min-w-[140px] sticky left-0 bg-primary/10 align-middle">Name</TableHead>

              {/* Paper subjects — grouped header */}
              {PAPER_SUBJECTS.map((s) => (
                <TableHead key={s.key} colSpan={4} className="font-bold text-foreground text-center border-l border-border/40 bg-primary/10">
                  {s.label}
                </TableHead>
              ))}

              {/* Simple subjects — each gets 2 columns: mark + band */}
              {SIMPLE_SUBJECTS.map((s) => (
                <TableHead key={s.key} colSpan={2} className="font-bold text-foreground text-center border-l border-border/40 bg-primary/10 align-middle">
                  {s.label}
                </TableHead>
              ))}

              <TableHead rowSpan={2} className="font-bold text-foreground text-center border-l border-primary/30 bg-primary/20 align-middle min-w-[60px]">Total</TableHead>
              <TableHead rowSpan={2} className="font-bold text-foreground text-center bg-primary/20 align-middle min-w-[60px]">Mean</TableHead>
              <TableHead rowSpan={2} className="font-bold text-foreground text-center bg-primary/10 align-middle min-w-[70px]">Band</TableHead>
              <TableHead rowSpan={2} className="font-bold text-foreground text-center bg-primary/10 align-middle min-w-[80px]">Actions</TableHead>
              <TableHead rowSpan={2} className="font-bold text-foreground w-16 bg-primary/10 align-middle text-center">Position</TableHead>
            </TableRow>

            {/* Row 2 — sub-column headers for paper subjects + simple subjects */}
            <TableRow className="bg-primary/5">
              {PAPER_SUBJECTS.map((s) => (
                <React.Fragment key={s.key}>
                  {s.papers.map((p) => (
                    <TableHead key={p.pkey} className="text-center text-xs text-muted-foreground font-medium py-1 border-l border-border/20 min-w-[52px]">
                      {p.label}<span className="text-[10px] text-muted-foreground/60">/{p.max}</span>
                    </TableHead>
                  ))}
                  <TableHead className="text-center text-xs text-blue-700 font-bold py-1 min-w-[52px]">Total</TableHead>
                  <TableHead className="text-center text-xs text-muted-foreground font-medium py-1 min-w-[46px]">Band</TableHead>
                </React.Fragment>
              ))}
              {SIMPLE_SUBJECTS.map((s) => (
                <React.Fragment key={s.key}>
                  <TableHead className="text-center text-xs text-muted-foreground font-medium py-1 border-l border-border/20 min-w-[60px]">
                    Mark<span className="text-[10px] text-muted-foreground/60">/100</span>
                  </TableHead>
                  <TableHead className="text-center text-xs text-muted-foreground font-medium py-1 min-w-[46px]">Band</TableHead>
                </React.Fragment>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {rankedStudents.map((student) => {
              const m = marks[student.id] || {};
              const overallTotal = calcOverallTotal(m);
              const overallBand = getBand(overallTotal / (PAPER_SUBJECTS.length + SIMPLE_SUBJECTS.length));

              return (
                <TableRow key={student.id} className="hover:bg-muted/50 transition-colors">
                  {/* Name */}
                  <TableCell className="font-medium sticky left-0 bg-background min-w-[140px] text-sm">{student.name}</TableCell>

                  {/* Paper subjects */}
                  {PAPER_SUBJECTS.map((subj) => {
                    const subjTotal = calcPaperTotal(m, subj);
                    const subjBand = getBand(subjTotal);
                    return (
                      <React.Fragment key={subj.key}>
                        {subj.papers.map((p) => (
                          <TableCell key={p.pkey} className="p-1 border-l border-border/20">
                            <PaperInput
                              value={m[p.pkey] ?? ''}
                              max={p.max}
                              onChange={(v) => setMark(student.id, p.pkey, v, p.max)}
                            />
                          </TableCell>
                        ))}
                        {/* Subject total — read-only */}
                        <TableCell className="p-1 text-center font-bold text-sm text-blue-700">
                          {subjTotal || '—'}
                        </TableCell>
                        {/* Subject band */}
                        <TableCell className="p-1 text-center">
                          <BandBadge score={subjTotal} />
                        </TableCell>
                      </React.Fragment>
                    );
                  })}

                  {/* Simple subjects */}
                  {SIMPLE_SUBJECTS.map((s) => {
                    const val = parseInt(m[s.key]) || 0;
                    return (
                      <React.Fragment key={s.key}>
                        <TableCell className="p-1 border-l border-border/20">
                          <PaperInput
                            value={m[s.key] ?? ''}
                            max={s.max}
                            onChange={(v) => setMark(student.id, s.key, v, s.max)}
                          />
                        </TableCell>
                        <TableCell className="p-1 text-center">
                          {val > 0 ? <BandBadge score={val} /> : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                      </React.Fragment>
                    );
                  })}

                  {/* Overall total */}
                  <TableCell className="text-center font-bold border-l border-primary/30">
                    {overallTotal || '—'}
                  </TableCell>

                  {/* Mean per learner */}
                  <TableCell className="text-center font-semibold text-primary text-sm bg-primary/5">
                    {overallTotal > 0 ? calcMean(m) : '—'}
                  </TableCell>

                  {/* Overall band */}
                  <TableCell className="text-center">
                    <BandBadge score={overallTotal / NUM_SUBJECTS} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center gap-1 justify-center">
                      {dirtyStudents.has(student.id) && (
                        <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => handleSave(student.id)} disabled={isSaving}>
                          <Save className="w-4 h-4 text-primary" />
                        </Button>
                      )}
                      {!dirtyStudents.has(student.id) && (
                        <Button
                          size="icon" variant="ghost" className="h-11 w-11"
                          title="Notify parent"
                          onClick={() => {
                            const registerInfo = findRegisterInfo(student, studentRegisterMap);
                            setSmsModal({ student: { ...student, parent_phone: registerInfo.parent_phone || student.parent_phone, parent_name: registerInfo.parent_name || student.parent_name }, marksData: marks[student.id] || {} });
                          }}
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-11 w-11">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Student</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {student.name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(student.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>

                  {/* Position */}
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center justify-center px-2 h-7 rounded-full text-xs font-bold ${
                      student.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      student.rank === 2 ? 'bg-gray-100 text-gray-600' :
                      student.rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {student.rank}{student.rank === 1 ? 'st' : student.rank === 2 ? 'nd' : student.rank === 3 ? 'rd' : 'th'}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
            {/* Averages footer row */}
            {(() => {
              const ids = rankedStudents.map(s => s.id);
              return (
                <TableRow className="bg-primary/10 font-bold border-t-2 border-primary/30">
                  <TableCell className="sticky left-0 bg-primary/10 text-xs font-bold text-primary">Class Avg</TableCell>

                  {/* Paper subject averages */}
                  {PAPER_SUBJECTS.map((subj) => (
                    <React.Fragment key={subj.key}>
                      {subj.papers.map((p) => (
                        <TableCell key={p.pkey} className="text-center text-xs font-semibold text-muted-foreground border-l border-border/20 p-1">
                          {colAvg(marks, ids, (m) => m[p.pkey])}
                        </TableCell>
                      ))}
                      <TableCell className="text-center text-xs font-bold text-blue-700 p-1">
                        {colAvg(marks, ids, (m) => calcPaperTotal(m, subj))}
                      </TableCell>
                      <TableCell className="p-1" />
                    </React.Fragment>
                  ))}

                  {/* Simple subject averages */}
                  {SIMPLE_SUBJECTS.map((s) => (
                    <React.Fragment key={s.key}>
                      <TableCell className="text-center text-xs font-semibold text-muted-foreground border-l border-border/20 p-1">
                        {colAvg(marks, ids, (m) => m[s.key])}
                      </TableCell>
                      <TableCell className="p-1" />
                    </React.Fragment>
                  ))}

                  {/* Overall avg */}
                  <TableCell className="text-center text-xs font-bold border-l border-primary/30">
                    {colAvg(marks, ids, (m) => calcOverallTotal(m))}
                  </TableCell>

                  {/* Mean avg */}
                  <TableCell className="text-center text-xs font-bold text-primary bg-primary/5">
                    {colAvg(marks, ids, (m) => calcOverallTotal(m) > 0 ? parseFloat(calcMean(m)) : '')}
                  </TableCell>

                  <TableCell /><TableCell /><TableCell />
                </TableRow>
              );
            })()}
          </TableBody>
        </Table>
      </div>

      <SmsNotifyModal
        open={!!smsModal}
        onOpenChange={(v) => !v && setSmsModal(null)}
        student={smsModal?.student}
        marksData={smsModal?.marksData}
        filters={filters}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
        <span className="font-medium">Bands:</span>
        <span className="text-green-700 font-bold">EE (80–100%)</span>
        <span className="text-blue-700 font-bold">ME (65–79%)</span>
        <span className="text-amber-700 font-bold">AE (50–64%)</span>
        <span className="text-red-700 font-bold">BE (0–49%)</span>

      </div>
    </div>
  );
}