import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Save, SaveAll } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getBand, bandTailwindColor } from '@/utils/bands';
import { getSubjectByKey } from '@/utils/gradeSubjects';

function BandBadge({ score }) {
  const band = getBand(score);
  if (!band) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${bandTailwindColor(band)}`}>
      {band}
    </span>
  );
}

function calcTotal(marks, subjectKeys) {
  return subjectKeys.reduce((sum, k) => sum + (parseInt(marks[k]) || 0), 0);
}

function calcMean(marks, subjectKeys) {
  if (!subjectKeys.length) return 0;
  return (calcTotal(marks, subjectKeys) / subjectKeys.length).toFixed(1);
}

function colAvg(allMarks, studentIds, getter) {
  const vals = studentIds.map(id => getter(allMarks[id] || {})).filter(v => v !== '' && !isNaN(v) && Number(v) > 0);
  if (!vals.length) return '—';
  return (vals.reduce((s, v) => s + Number(v), 0) / vals.length).toFixed(1);
}

export default function SimpleMarksTable({ students, subjectKeys, onUpdateMarks, onDelete, isSaving }) {
  const [marks, setMarks] = useState({});
  const [dirtyStudents, setDirtyStudents] = useState(new Set());

  const subjects = subjectKeys.map(k => getSubjectByKey(k)).filter(Boolean);

  useEffect(() => {
    const init = {};
    students.forEach(s => {
      init[s.id] = {};
      subjectKeys.forEach(k => { init[s.id][k] = s[k] ?? ''; });
    });
    setMarks(init);
    setDirtyStudents(new Set());
  }, [students, subjectKeys.join(',')]);

  const setMark = (studentId, key, rawValue) => {
    const clamped = rawValue === '' ? '' : Math.min(100, Math.max(0, parseInt(rawValue) || 0));
    setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], [key]: clamped } }));
    setDirtyStudents(prev => new Set([...prev, studentId]));
  };

  const handleSave = (studentId) => {
    const m = marks[studentId] || {};
    const data = {};
    subjectKeys.forEach(k => {
      data[k] = m[k] === '' ? null : parseInt(m[k]) || 0;
      data[`${k}_band`] = getBand(data[k]);
    });
    const total = calcTotal(m, subjectKeys);
    const mean = subjectKeys.length ? total / subjectKeys.length : 0;
    data.overall_band = getBand(mean);
    data.subjects_config = subjectKeys;
    onUpdateMarks(studentId, data);
    setDirtyStudents(prev => { const n = new Set(prev); n.delete(studentId); return n; });
  };

  const handleSaveAll = () => dirtyStudents.forEach(id => handleSave(id));

  const rankedStudents = [...students]
    .map(s => ({ ...s, _total: calcTotal(marks[s.id] || {}, subjectKeys) }))
    .sort((a, b) => b._total - a._total)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  if (students.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">No students yet. Add students to start entering marks.</p>
      </div>
    );
  }

  const ids = rankedStudents.map(s => s.id);

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
            <TableRow className="bg-primary/10">
              <TableHead className="font-bold text-foreground w-16 text-center sticky left-0 bg-primary/10">Position</TableHead>
              <TableHead className="font-bold text-foreground min-w-[140px] sticky left-10 bg-primary/10">Name</TableHead>
              {subjects.map(s => (
                <TableHead key={s.key} className="font-bold text-foreground text-center min-w-[90px]">{s.label}</TableHead>
              ))}
              <TableHead className="font-bold text-foreground text-center bg-primary/20 min-w-[60px] border-l border-primary/30">Total</TableHead>
              <TableHead className="font-bold text-foreground text-center bg-primary/20 min-w-[60px]">Mean</TableHead>
              <TableHead className="font-bold text-foreground text-center bg-primary/10 min-w-[56px]">Band</TableHead>
              <TableHead className="font-bold text-foreground text-center bg-primary/10 w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rankedStudents.map(student => {
              const m = marks[student.id] || {};
              const total = calcTotal(m, subjectKeys);
              const mean = parseFloat(calcMean(m, subjectKeys));
              const band = getBand(mean);

              return (
                <TableRow key={student.id} className="hover:bg-muted/50">
                  {/* Position */}
                  <TableCell className="sticky left-0 bg-background text-center">
                    <span className={`inline-flex items-center justify-center px-2 h-7 rounded-full text-xs font-bold ${
                      student.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      student.rank === 2 ? 'bg-gray-100 text-gray-600' :
                      student.rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {student.rank}{student.rank === 1 ? 'st' : student.rank === 2 ? 'nd' : student.rank === 3 ? 'rd' : 'th'}
                    </span>
                  </TableCell>

                  {/* Name */}
                  <TableCell className="font-medium sticky left-10 bg-background min-w-[140px] text-sm">{student.name}</TableCell>

                  {/* Subject marks */}
                  {subjects.map(s => {
                    const val = m[s.key] ?? '';
                    const num = parseInt(val) || 0;
                    const isLow = num > 0 && num < 40;
                    return (
                      <TableCell key={s.key} className="p-1">
                        <div className="space-y-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={val}
                            onChange={e => setMark(student.id, s.key, e.target.value)}
                            className={`w-20 h-7 text-center text-xs mx-auto ${isLow ? 'border-red-400 bg-red-50 text-red-700' : ''}`}
                          />
                          {num > 0 && (
                            <div className="text-center">
                              <BandBadge score={num} />
                            </div>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}

                  {/* Total */}
                  <TableCell className="text-center font-bold border-l border-primary/30">
                    {total > 0 ? total : '—'}
                  </TableCell>

                  {/* Mean */}
                  <TableCell className="text-center font-semibold text-primary text-sm bg-primary/5">
                    {total > 0 ? mean : '—'}
                  </TableCell>

                  {/* Overall band */}
                  <TableCell className="text-center">
                    {total > 0 ? <BandBadge score={mean} /> : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center gap-1 justify-center">
                      {dirtyStudents.has(student.id) && (
                        <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => handleSave(student.id)} disabled={isSaving}>
                          <Save className="w-4 h-4 text-primary" />
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
                            <AlertDialogDescription>Remove {student.name}? This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(student.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Class averages row */}
            <TableRow className="bg-primary/10 font-bold border-t-2 border-primary/30">
              <TableCell className="sticky left-0 bg-primary/10 text-center text-xs text-muted-foreground">—</TableCell>
              <TableCell className="sticky left-10 bg-primary/10 text-xs font-bold text-primary">Class Avg</TableCell>
              {subjects.map(s => (
                <TableCell key={s.key} className="text-center text-xs font-semibold text-muted-foreground p-1">
                  {colAvg(marks, ids, m => m[s.key])}
                </TableCell>
              ))}
              <TableCell className="text-center text-xs font-bold border-l border-primary/30">
                {colAvg(marks, ids, m => calcTotal(m, subjectKeys))}
              </TableCell>
              <TableCell className="text-center text-xs font-bold text-primary bg-primary/5">
                {colAvg(marks, ids, m => {
                  const t = calcTotal(m, subjectKeys);
                  return t > 0 ? parseFloat(calcMean(m, subjectKeys)) : '';
                })}
              </TableCell>
              <TableCell /><TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
        <span className="font-medium">Bands:</span>
        <span className="text-green-700 font-bold">EE (80–100)</span>
        <span className="text-blue-700 font-bold">ME (60–79)</span>
        <span className="text-amber-700 font-bold">AE (40–59)</span>
        <span className="text-red-700 font-bold">BE (&lt;40)</span>
        <span className="ml-2">· Red input = score below 40</span>
      </div>
    </div>
  );
}