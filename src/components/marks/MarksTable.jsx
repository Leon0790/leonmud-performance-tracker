import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Save } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getBand, bandTailwindColor, ALL_BANDS } from '@/utils/bands';

const SUBJECTS = [
  { key: 'mathematics', label: 'Maths' },
  { key: 'english', label: 'English' },
  { key: 'kiswahili', label: 'Kisw.' },
  { key: 'integrated_science', label: 'Int.Sci' },
  { key: 'agriculture', label: 'Agri.' },
  { key: 'social_studies', label: 'S.Studies' },
  { key: 'pretechnical_studies', label: 'Pre-Tech' },
  { key: 'religious_studies', label: 'Religious' },
  { key: 'creative_art', label: 'Art' },
];

const BANDS = ALL_BANDS;

const BAND_COLORS = Object.fromEntries(ALL_BANDS.map(b => [b, bandTailwindColor(b)]));

function autoBand(score) {
  return getBand(score);
}

export default function MarksTable({ students, onUpdateMarks, onDelete, isSaving }) {
  const [editedMarks, setEditedMarks] = useState({});
  const [editedBands, setEditedBands] = useState({});
  const [dirtyStudents, setDirtyStudents] = useState(new Set());

  useEffect(() => {
    const marks = {};
    const bands = {};
    students.forEach((s) => {
      marks[s.id] = {};
      bands[s.id] = {};
      SUBJECTS.forEach(({ key }) => {
        marks[s.id][key] = s[key] ?? '';
        // Use saved band or auto-calculate
        bands[s.id][key] = s[`${key}_band`] || autoBand(s[key]);
      });
    });
    setEditedMarks(marks);
    setEditedBands(bands);
    setDirtyStudents(new Set());
  }, [students]);

  const handleMarkChange = (studentId, subject, value) => {
    const num = value === '' ? '' : Math.min(100, Math.max(0, parseInt(value) || 0));
    setEditedMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [subject]: num },
    }));
    // Auto-update band unless manually overridden
    setEditedBands((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [subject]: autoBand(num) },
    }));
    setDirtyStudents((prev) => new Set([...prev, studentId]));
  };

  const handleBandChange = (studentId, subject, band) => {
    setEditedBands((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [subject]: band },
    }));
    setDirtyStudents((prev) => new Set([...prev, studentId]));
  };

  const getTotal = (studentId) => {
    const marks = editedMarks[studentId] || {};
    return SUBJECTS.reduce((sum, { key }) => sum + (parseInt(marks[key]) || 0), 0);
  };

  const rankedStudents = [...students]
    .map((s) => ({ ...s, _total: getTotal(s.id) }))
    .sort((a, b) => b._total - a._total)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  const handleSave = (studentId) => {
    const marks = editedMarks[studentId] || {};
    const bands = editedBands[studentId] || {};
    const data = {};
    SUBJECTS.forEach(({ key }) => {
      data[key] = marks[key] === '' ? null : parseInt(marks[key]) || 0;
      data[`${key}_band`] = bands[key] || '';
    });
    onUpdateMarks(studentId, data);
    setDirtyStudents((prev) => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
  };

  if (students.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">No students yet. Add students to start entering marks.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary/10">
            <TableHead className="font-bold text-foreground w-12 sticky left-0 bg-primary/10">Rank</TableHead>
            <TableHead className="font-bold text-foreground min-w-[140px] sticky left-12 bg-primary/10">Name</TableHead>
            {SUBJECTS.map(({ key, label }) => (
              <TableHead key={key} className="font-bold text-foreground text-center min-w-[130px]" colSpan={2}>
                {label}
              </TableHead>
            ))}
            <TableHead className="font-bold text-foreground text-center">Total</TableHead>
            <TableHead className="font-bold text-foreground text-center w-20">Actions</TableHead>
          </TableRow>
          <TableRow className="bg-primary/5">
            <TableHead className="sticky left-0 bg-primary/5" />
            <TableHead className="sticky left-12 bg-primary/5" />
            {SUBJECTS.map(({ key }) => (
              <React.Fragment key={key}>
                <TableHead className="text-center text-xs text-muted-foreground font-medium py-1">Marks</TableHead>
                <TableHead className="text-center text-xs text-muted-foreground font-medium py-1">Band</TableHead>
              </React.Fragment>
            ))}
            <TableHead />
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankedStudents.map((student) => {
            const total = getTotal(student.id);
            return (
              <TableRow key={student.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="sticky left-0 bg-background">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                    student.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                    student.rank === 2 ? 'bg-gray-100 text-gray-600' :
                    student.rank === 3 ? 'bg-orange-100 text-orange-700' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {student.rank}
                  </span>
                </TableCell>
                <TableCell className="font-medium sticky left-12 bg-background min-w-[140px]">{student.name}</TableCell>
                {SUBJECTS.map(({ key }) => {
                  const band = editedBands[student.id]?.[key] || '';
                  return (
                    <React.Fragment key={key}>
                      <TableCell className="p-1 text-center">
                        <Select
                          value={band}
                          onValueChange={(v) => handleBandChange(student.id, key, v)}
                        >
                          <SelectTrigger className={`w-16 h-7 text-xs px-1 font-bold border-0 ${band ? BAND_COLORS[band] : 'text-muted-foreground'}`}>
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=" ">—</SelectItem>
                            {BANDS.map(b => (
                              <SelectItem key={b} value={b} className={BAND_COLORS[b]}>{b}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editedMarks[student.id]?.[key] ?? ''}
                          onChange={(e) => handleMarkChange(student.id, key, e.target.value)}
                          className="w-14 h-7 text-center text-xs mx-auto"
                        />
                      </TableCell>
                    </React.Fragment>
                  );
                })}
                <TableCell className="text-center font-bold">{total}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-center">
                    {dirtyStudents.has(student.id) && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSave(student.id)} disabled={isSaving}>
                        <Save className="w-3.5 h-3.5 text-primary" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
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
                          <AlertDialogAction onClick={() => onDelete(student.id)} className="bg-destructive text-destructive-foreground">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}