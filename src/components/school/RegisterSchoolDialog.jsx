import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Mail, School as SchoolIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const FIELDS = [
  ['name', 'School name *'],
  ['code', 'Unique school code *'],
  ['county', 'County'],
  ['sub_county', 'Sub-county'],
  ['email', 'School email'],
  ['contact_number', 'Contact number'],
  ['headteacher_name', 'Headteacher full name'],
  ['headteacher_email', 'Headteacher email address'],
];

const EMPTY = {
  name: '', code: '', county: '', sub_county: '', email: '',
  contact_number: '', headteacher_name: '', headteacher_email: '',
};

export default function RegisterSchoolDialog({ open, onOpenChange, onRegistered }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [blocked, setBlocked] = useState(false);

  const reset = () => {
    setForm(EMPTY);
    setDuplicates([]);
    setBlocked(false);
  };

  const submit = async (force) => {
    if (!form.name.trim() || !form.code.trim()) {
      toast({ title: 'School name and code are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await base44.functions.invoke('platformAccount', {
        action: 'registerSchoolAndInvite',
        ...form,
        force: !!force,
      });
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      if (!data.school) {
        setDuplicates(data.duplicates || []);
        setBlocked(!!data.blocked);
        return;
      }
      toast({
        title: 'School registered',
        description: data.invite?.email
          ? `${form.name} created. Headteacher invited at ${data.invite.email}.`
          : `${form.name} created. You can invite the headteacher later.`,
      });
      onRegistered?.(data.school);
      reset();
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Could not register school', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg w-full max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register a new school</DialogTitle>
          <DialogDescription>
            The headteacher receives an invitation and is connected to this school automatically when they sign in.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FIELDS.map(([key, label]) => (
            <div key={key}>
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input
                className="mt-1"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>

        {duplicates.length > 0 && (
          <div className={`rounded-lg border p-3 space-y-2 ${blocked ? 'border-destructive/40 bg-destructive/5' : 'border-amber-300 bg-amber-50'}`}>
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              {blocked ? 'This school is already registered' : 'Possible duplicate school'}
            </p>
            <p className="text-xs text-muted-foreground">
              {blocked
                ? 'A school with the same name or code exists. Open it instead of creating a second copy.'
                : 'A school with a similar name exists. Check it before registering another copy.'}
            </p>
            <div className="space-y-1.5">
              {duplicates.map((dup) => (
                <div key={dup.id} className="rounded-md bg-card border p-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{dup.name} · <span className="font-mono">{dup.code}</span></p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {[dup.sub_county, dup.county].filter(Boolean).join(', ')} · {dup.reason}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="gap-1 shrink-0">
                    <Link to={`/super-admin/schools/${dup.id}`}>
                      <SchoolIcon className="w-3.5 h-3.5" /> Open
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!blocked && duplicates.length > 0 && (
            <Button variant="outline" className="flex-1" onClick={() => submit(true)} disabled={saving}>
              Register anyway
            </Button>
          )}
          <Button className="flex-1 gap-2" onClick={() => submit(false)} disabled={saving}>
            <Mail className="w-4 h-4" />
            {saving ? 'Working…' : 'Register school and invite headteacher'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}