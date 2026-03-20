import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

const SUBJECTS = [
  { key: 'mathematics', label: 'Maths' },
  { key: 'english', label: 'English' },
  { key: 'kiswahili', label: 'Kiswahili' },
  { key: 'integrated_science', label: 'Int. Science' },
  { key: 'agriculture', label: 'Agriculture' },
  { key: 'social_studies', label: 'Social Stud.' },
  { key: 'pretechnical_studies', label: 'Pre-Tech' },
  { key: 'religious_studies', label: 'Religious' },
  { key: 'creative_art', label: 'Creative Art' },
];

export default function MarksTable({ students, onUpdateMarks, onDelete, isSaving }) {
  const [editedMarks, setEditedMarks] = useState({});
  const [dirtyStudents, setDirtyStudents] = useState(new Set());

  useEffect(() => {
    const marks = {};
    students.forEach((s) => {
      marks[s.id] = {};
      SUBJECTS.forEach(({ key }) => {
        marks[s.id][key] = s[key] ?? '';
      });
    });
    setEditedMarks(marks);
    setDirtyStudents(new Set());
  }, [students]);

  const handleMarkChange = (studentId, subject, value) => {
    const num = value === '' ? '' : Math.min(100, Math.max(0, parseInt(value) || 0));
    setEditedMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [subject]: num },
    }));
    setDirtyStudents((prev) => new Set([...prev, studentId]));
  };

  const getTotal = (studentId) => {
    const marks = editedMarks[studentId] || {};
    return SUBJECTS.reduce((sum, { key }) => sum + (parseInt(marks[key]) || 0), 0);
  };

  const getAverage = (studentId) => {
    const total = getTotal(studentId);
    return (total / SUBJECTS.length).toFixed(1);
  };

  // Rank students by total
  const rankedStudents = [...students]
    .map((s) => ({ ...s, total: getTotal(s.id), average: parseFloat(getAverage(s.id)) }))
    .sort((a, b) => b.total - a.total)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  const handleSave = (studentId) => {
    const marks = editedMarks[studentId] || {};
    const data = {};
    SUBJECTS.forEach(({ key }) => {
      data[key] = marks[key] === '' ? null : parseInt(marks[key]) || 0;
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
            <TableHead className="font-bold text-foreground w-12">#</TableHead>
            <TableHead className="font-bold text-foreground min-w-[150px]">Student Name</TableHead>
            {SUBJECTS.map(({ key, label }) => (
              <TableHead key={key} className="font-bold text-foreground text-center min-w-[90px]">{label}</TableHead>
            ))}
            <TableHead className="font-bold text-foreground text-center">Total</TableHead>
            <TableHead className="font-bold text-foreground text-center">Avg</TableHead>
            <TableHead className="font-bold text-foreground text-center">Rank</TableHead>
            <TableHead className="font-bold text-foreground text-center w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankedStudents.map((student) => (
            <TableRow key={student.id} className="hover:bg-muted/50 transition-colors">
              <TableCell className="font-bold text-primary">{student.rank}</TableCell>
              <TableCell className="font-medium">{student.name}</TableCell>
              {SUBJECTS.map(({ key }) => (
                <TableCell key={key} className="p-1">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editedMarks[student.id]?.[key] ?? ''}
                    onChange={(e) => handleMarkChange(student.id, key, e.target.value)}
                    className="w-16 h-8 text-center text-sm mx-auto"
                  />
                </TableCell>
              ))}
              <TableCell className="text-center font-bold text-lg">{student.total}</TableCell>
              <TableCell className="text-center font-semibold">{student.average}</TableCell>
              <TableCell className="text-center">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                  student.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                  student.rank === 2 ? 'bg-gray-100 text-gray-600' :
                  student.rank === 3 ? 'bg-orange-100 text-orange-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {student.rank}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 justify-center">
                  {dirtyStudents.has(student.id) && (
                    <Button size="icon" variant="ghost" onClick={() => handleSave(student.id)} disabled={isSaving}>
                      <Save className="w-4 h-4 text-primary" />
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost">
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
                        <AlertDialogAction onClick={() => onDelete(student.id)} className="bg-destructive text-destructive-foreground">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}