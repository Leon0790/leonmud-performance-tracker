import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function InviteHeadteacherDialog({ open, school, onOpenChange, onDone }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(school?.headteacher_name || '');
    setEmail(school?.headteacher_email || '');
  }, [open, school?.id]);

  const send = async () => {
    if (!email.trim()) {
      toast({ title: 'Headteacher email is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await base44.functions.invoke('platformAccount', {
        action: 'inviteMember',
        school_id: school.id,
        email: email.trim().toLowerCase(),
        teacher_name: name.trim(),
        user_type: 'headteacher',
      });
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      await base44.entities.School.update(school.id, {
        headteacher_name: name.trim(),
        headteacher_email: email.trim().toLowerCase(),
      });
      toast({
        title: 'Headteacher invited',
        description: data.note || `${email.trim()} will join ${school.name} when they sign in.`,
      });
      onDone?.();
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Could not invite headteacher', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Invite headteacher</DialogTitle>
          <DialogDescription>
            For {school?.name}. They become Headteacher Admin of this school as soon as they sign in with this email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Full name</Label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Email address</Label>
            <Input className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="head@example.com" />
          </div>
          <Button className="w-full gap-2" onClick={send} disabled={saving || !email.trim()}>
            <Send className="w-4 h-4" /> {saving ? 'Sending…' : 'Send invitation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}