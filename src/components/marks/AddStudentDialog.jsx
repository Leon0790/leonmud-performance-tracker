import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function AddStudentDialog({ open, onOpenChange, onAdd, isAdding }) {
  const [name, setName] = useState('');
  const [admNo, setAdmNo] = useState('');

  // ✅ Reset fields when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setAdmNo('');
    }
  }, [open]);

  const handleAdd = async () => {
    if (!name.trim()) return;

    try {
      await onAdd({
        name: name.trim(),
        admission_number: admNo.trim()
      });

      // ✅ Only clear AFTER successful add
      setName('');
      setAdmNo('');

      // ✅ Close dialog after adding
      onOpenChange(false);

    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="studentName">Student Name</Label>
            <Input
              id="studentName"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="admNo">Admission Number (optional)</Label>
            <Input
              id="admNo"
              placeholder="e.g. 2024/001"
              value={admNo}
              onChange={(e) => setAdmNo(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button onClick={handleAdd} disabled={!name.trim() || isAdding}>
            {isAdding ? 'Adding...' : 'Add Student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}