import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const GRADES = ['Grade 7', 'Grade 8', 'Grade 9'];
const TERMS = ['Term 1', 'Term 2', 'Term 3'];
const EXAM_TYPES = ['Mid Term', 'End Term'];

export default function MarksFilters({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap gap-4">
      <div className="min-w-[140px]">
        <Label className="text-xs text-muted-foreground mb-1 block">Grade</Label>
        <Select value={filters.grade} onValueChange={(v) => update('grade', v)}>
          <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
          <SelectContent>
            {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-[130px]">
        <Label className="text-xs text-muted-foreground mb-1 block">Term</Label>
        <Select value={filters.term} onValueChange={(v) => update('term', v)}>
          <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
          <SelectContent>
            {TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-[140px]">
        <Label className="text-xs text-muted-foreground mb-1 block">Exam Type</Label>
        <Select value={filters.exam_type} onValueChange={(v) => update('exam_type', v)}>
          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            {EXAM_TYPES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}