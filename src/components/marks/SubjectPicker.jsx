import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ALL_SUBJECTS, getDefaultSubjectsForGrade } from '@/utils/gradeSubjects';
import { BookOpen, Check } from 'lucide-react';

export default function SubjectPicker({ grade, selected, onChange, onConfirm }) {
  const defaults = getDefaultSubjectsForGrade(grade);

  const toggle = (key) => {
    if (selected.includes(key)) {
      onChange(selected.filter(k => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  const selectDefaults = () => onChange(defaults);

  return (
    <Card className="border-primary/40 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Select Learning Areas for {grade}
        </CardTitle>
        <p className="text-sm text-muted-foreground">Choose the subjects you teach for this grade. You can change this later.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{selected.length} selected</span>
          <button onClick={selectDefaults} className="text-xs text-primary font-medium hover:underline">
            Use defaults for {grade}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ALL_SUBJECTS.map((s) => {
            const isSelected = selected.includes(s.key);
            return (
              <button
                key={s.key}
                onClick={() => toggle(s.key)}
                className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-border hover:border-primary/40 text-foreground'
                }`}
              >
                <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${isSelected ? 'bg-primary border-primary' : 'border-border'}`}>
                  {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                </span>
                {s.label}
              </button>
            );
          })}
        </div>

        <Button
          className="w-full"
          disabled={selected.length === 0}
          onClick={onConfirm}
        >
          Confirm {selected.length} Subject{selected.length !== 1 ? 's' : ''} & Continue
        </Button>
      </CardContent>
    </Card>
  );
}