import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Save, User, Phone, MessageSquare } from 'lucide-react';

const GRADES = ['Grade 7', 'Grade 8', 'Grade 9'];

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0') && digits.length === 10) return '254' + digits.slice(1);
  if (digits.length === 9) return '254' + digits;
  return digits;
}

function buildWelcomeWhatsApp(phone, name) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const message = encodeURIComponent(
    `Hello ${name || 'Teacher'} 👋, welcome to *LeonMud Performance Tracker*!\n\nYour teacher profile has been successfully registered. You can now:\n• Enter & track student marks\n• Generate report cards\n• Monitor class performance\n\nHappy teaching! 🎓`
  );
  return `https://wa.me/${normalized}?text=${message}`;
}

export default function TeacherProfileCard({ profile, onSave, isSaving, isNewProfile }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    class_grade: profile?.class_grade || '',
    class_name: profile?.class_name || '',
    phone: profile?.phone || '',
  });

  const [showWelcomePrompt, setShowWelcomePrompt] = useState(false);
  const [savedPhone, setSavedPhone] = useState(null);
  const [savedName, setSavedName] = useState(null);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        class_grade: profile.class_grade || '',
        class_name: profile.class_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile?.id]);

  const handleSave = () => {
    const isFirstSave = !profile;
    onSave(form, (savedProfile) => {
      // After save, if phone provided and first-time, show welcome prompt
      if (isFirstSave && form.phone) {
        setSavedPhone(form.phone);
        setSavedName(form.full_name);
        setShowWelcomePrompt(true);
      }
    });
  };

  const handleSendWelcome = () => {
    const url = buildWelcomeWhatsApp(savedPhone, savedName);
    if (url) window.open(url, '_blank');
    setShowWelcomePrompt(false);
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
        <div>
          <Label htmlFor="phone" className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" /> Phone Number
          </Label>
          <Input
            id="phone"
            placeholder="e.g. 0712345678"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <p className="text-xs text-muted-foreground mt-1">Used to send WhatsApp welcome message after first registration.</p>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Profile'}
        </Button>

        {/* Welcome message prompt */}
        {showWelcomePrompt && (
          <div className="rounded-lg border border-green-300 bg-green-50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-800 font-semibold text-sm">
              <MessageSquare className="w-4 h-4" />
              Profile registered! Send welcome message?
            </div>
            <p className="text-xs text-green-700">
              A WhatsApp welcome message will be sent to <strong>{savedPhone}</strong>.
            </p>
            <div className="flex gap-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5" onClick={handleSendWelcome}>
                <MessageSquare className="w-3.5 h-3.5" /> Send via WhatsApp
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowWelcomePrompt(false)}>
                Skip
              </Button>
            </div>
          </div>
        )}

        {/* Manual send button if phone is on file and already registered */}
        {profile && profile.phone && !showWelcomePrompt && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-green-700 border-green-300"
            onClick={() => {
              const url = buildWelcomeWhatsApp(profile.phone, profile.full_name);
              if (url) window.open(url, '_blank');
            }}
          >
            <MessageSquare className="w-4 h-4" />
            Re-send Welcome Message
          </Button>
        )}
      </CardContent>
    </Card>
  );
}