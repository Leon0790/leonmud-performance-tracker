import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Search, UserCheck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const ROLE_LABELS = { super_admin: 'Super Admin', headteacher: 'Headteacher Admin', teacher: 'Teacher' };

export default function LinkAccountDialog({ open, school, onOpenChange, onLinked }) {
  const [email, setEmail] = useState('');
  const [account, setAccount] = useState(null);
  const [looking, setLooking] = useState(false);
  const [role, setRole] = useState('teacher');
  const [transfer, setTransfer] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setAccount(null);
      setTransfer(false);
      setConfirmed(false);
      setRole('teacher');
    }
  }, [open]);

  const lookup = async () => {
    if (!email.trim()) return;
    setLooking(true);
    setAccount(null);
    setConfirmed(false);
    try {
      const res = await base44.functions.invoke('platformAccount', {
        action: 'lookupAccount',
        email: email.trim().toLowerCase(),
      });
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      if (!data.found) {
        toast({ title: 'No LeonMud account found', description: 'Use the invitation instead — linking is only for accounts that already exist.' });
        return;
      }
      setAccount(data.account);
      setRole(data.account.user_type === 'headteacher' ? 'headteacher' : 'teacher');
    } catch (e) {
      toast({ title: 'Lookup failed', description: e.message, variant: 'destructive' });
    } finally {
      setLooking(false);
    }
  };

  const link = async () => {
    setSaving(true);
    try {
      const res = await base44.functions.invoke('platformAccount', {
        action: 'linkAccount',
        email: account.email,
        school_id: school.id,
        user_type: role,
        transfer_records: transfer,
        confirm: true,
      });
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      toast({ title: 'Account linked', description: `${account.email} now belongs to ${school.name}.` });
      onLinked?.();
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Could not link account', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const alreadyHere = account?.school_id && account.school_id === school?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Link an existing account</DialogTitle>
          <DialogDescription>
            Only for a teacher or headteacher who already has a LeonMud account. New staff should be invited by email instead.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Account email</Label>
            <div className="flex gap-2 mt-1">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
              <Button variant="outline" onClick={lookup} disabled={looking || !email.trim()}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {account && (
            <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5">
              <p className="text-sm font-semibold">{account.full_name}</p>
              <p className="text-xs text-muted-foreground">{account.email}</p>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <p className="text-muted-foreground">Current role</p>
                  <p className="font-medium">{ROLE_LABELS[account.user_type] || account.user_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current school</p>
                  <p className="font-medium">{account.school_name || 'Not linked'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Records they created</p>
                  <p className="font-medium">{account.learners} learner records</p>
                </div>
              </div>
            </div>
          )}

          {account && (
            <>
              {alreadyHere && (
                <p className="text-xs rounded-md bg-amber-50 border border-amber-200 text-amber-800 p-2">
                  This account is already part of {school?.name}.
                </p>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Role in this school</Label>
                <div className="flex gap-2 mt-1">
                  <Button size="sm" variant={role === 'teacher' ? 'default' : 'outline'} onClick={() => setRole('teacher')}>
                    Teacher
                  </Button>
                  <Button size="sm" variant={role === 'headteacher' ? 'default' : 'outline'} onClick={() => setRole('headteacher')}>
                    Headteacher
                  </Button>
                </div>
              </div>

              <div className="rounded-md border border-amber-300 bg-amber-50 p-2.5 space-y-1">
                <p className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> What this changes
                </p>
                <p className="text-[11px] text-amber-900">
                  Their school association changes immediately. Existing learners, marks and reports stay with the account that
                  created them and are not moved automatically.
                </p>
              </div>

              <label className="flex items-start gap-2 text-xs cursor-pointer">
                <Checkbox checked={transfer} onCheckedChange={(v) => setTransfer(!!v)} className="mt-0.5" />
                <span>Also move their unassigned learners, marks, attendance and lesson plans into {school?.name}.</span>
              </label>

              <label className="flex items-start gap-2 text-xs cursor-pointer">
                <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} className="mt-0.5" />
                <span>I confirm this person agreed to join {school?.name} and I want to change their school association.</span>
              </label>

              <Button className="w-full gap-2" onClick={link} disabled={saving || !confirmed || alreadyHere}>
                <UserCheck className="w-4 h-4" />
                {saving ? 'Linking…' : 'Confirm and link account'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}