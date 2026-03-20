import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Save, User } from 'lucide-react';

const GRADES = ['Grade 7', 'Grade 8', 'Grade 9'];

export default function TeacherProfileCard({ profile, onSave, isSaving }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    class_grade: profile?.class_grade || '',
    class_name: profile?.class_name || '',
  });

  // Sync form when profile loads from server
  React.useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        class_grade: profile.class_grade || '',
        class_name: profile.class_name || '',
      });
    }
  }, [profile?.id]);

  const handleSave = () => {
    onSave(form);
  };

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="w-5 h-5 text-primary" />
          Teacher Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="Enter your full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </div>
        <div>
          <Label>Class Grade</Label>
          <Select value={form.class_grade} onValueChange={(v) => setForm({ ...form, class_grade: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {GRADES.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="className">Class Name / Section</Label>
          <Input
            id="className"
            placeholder="e.g. East, West, A, B"
            value={form.class_name}
            onChange={(e) => setForm({ ...form, class_name: e.target.value })}
          />
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Profile'}
        </Button>
      </CardContent>
    </Card>
  );
}