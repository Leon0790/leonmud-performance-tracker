import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Megaphone, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAccount } from '@/hooks/use-account';
import { format } from 'date-fns';

export default function SchoolAnnouncements() {
  const { user, schoolId, schoolName, isHeadteacher, isSuperAdmin, loading } = useAccount();
  const canPost = isHeadteacher || isSuperAdmin;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', important: false });
  const [saving, setSaving] = useState(false);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['school-announcements', schoolId],
    queryFn: () => base44.entities.Announcement.filter({ school_id: schoolId }, '-created_date', 50),
    enabled: !!schoolId,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['school-announcements', schoolId] });

  const post = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({ title: 'Add a title and a message', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Announcement.create({
        school_id: schoolId,
        title: form.title.trim(),
        message: form.message.trim(),
        important: form.important,
        author_email: user?.email || '',
        author_name: user?.full_name || user?.email || '',
      });
      toast({ title: 'Announcement posted' });
      setForm({ title: '', message: '', important: false });
      setOpen(false);
      refresh();
    } catch (e) {
      toast({ title: 'Could not post', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    await base44.entities.Announcement.delete(item.id);
    refresh();
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" /> Announcements
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{schoolName || 'Your school'} · school-wide notices for teachers</p>
        </div>
        {canPost && (
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" /> New announcement
          </Button>
        )}
      </div>

      {loading || isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-14 text-center text-muted-foreground">No announcements yet.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {announcements.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{item.title}</p>
                    {item.important && (
                      <Badge className="text-[10px] bg-amber-500 text-white gap-1">
                        <AlertCircle className="w-3 h-3" /> Important
                      </Badge>
                    )}
                  </div>
                  {canPost && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(item)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.message}</p>
                <p className="text-[11px] text-muted-foreground pt-1">
                  {item.author_name || item.author_email} · {item.created_date ? format(new Date(item.created_date), 'd MMM yyyy, HH:mm') : ''}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>New announcement</DialogTitle>
            <DialogDescription>Every teacher in your school sees this immediately.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Title</Label>
              <Input className="mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Message</Label>
              <Textarea className="mt-1" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.important}
                onChange={(e) => setForm({ ...form, important: e.target.checked })}
                className="rounded border-input"
              />
              Mark as important
            </label>
            <Button className="w-full" onClick={post} disabled={saving}>{saving ? 'Posting…' : 'Post announcement'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}