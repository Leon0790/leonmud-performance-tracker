import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Copy, Check, Phone, Send, Smartphone } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const SUBJECTS = [
  { key: 'mathematics', label: 'Maths' },
  { key: 'kiswahili', label: 'Kiswahili' },
  { key: 'english', label: 'English' },
  { key: 'integrated_science', label: 'Science' },
  { key: 'agriculture', label: 'Agri' },
  { key: 'social_studies', label: 'S.Studies' },
  { key: 'pretechnical_studies', label: 'Pre-Tech' },
  { key: 'religious_studies', label: 'Religious' },
  { key: 'creative_art', label: 'Art' },
];

function buildMessage(student, marksData, filters) {
  const lines = [
    `Dear Parent/Guardian,`,
    ``,
    `${student.name}'s ${filters.exam_type} results for ${filters.term} - ${filters.grade}:`,
    ``,
  ];

  SUBJECTS.forEach(({ key, label }) => {
    const mark = marksData[key];
    const band = marksData[`${key}_band`];
    if (mark !== null && mark !== undefined && mark !== '') {
      lines.push(`${label}: ${mark}/100 (${band || '—'})`);
    }
  });

  const total = SUBJECTS.reduce((sum, { key }) => sum + (Number(marksData[key]) || 0), 0);
  const avg = (total / SUBJECTS.length).toFixed(1);

  lines.push(``);
  lines.push(`Total: ${total} | Average: ${avg}`);
  lines.push(`Overall Band: ${marksData.overall_band || '—'}`);
  lines.push(``);
  lines.push(`LeonMud Performance Tracker`);

  return lines.join('\n');
}

function formatPhone(phone) {
  if (!phone) return null;
  // Normalize Kenyan numbers to WhatsApp format (254XXXXXXXXX)
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 10) return '254' + cleaned.slice(1);
  if (cleaned.startsWith('254')) return cleaned;
  if (cleaned.startsWith('7') && cleaned.length === 9) return '254' + cleaned;
  return cleaned;
}

export default function SmsNotifyModal({ open, onOpenChange, student, marksData, filters }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!student || !marksData) return null;

  const message = buildMessage(student, marksData, filters);
  const phone = formatPhone(student.parent_phone);
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : null;
  const smsUrl = student.parent_phone
    ? `sms:${student.parent_phone}?body=${encodeURIComponent(message)}`
    : null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    toast({ title: 'Message copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            Notify Parent — {student.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Parent phone */}
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            {student.parent_phone
              ? <span className="font-medium">{student.parent_phone}</span>
              : <span className="text-destructive text-xs">No parent phone registered for this student</span>}
          </div>

          {/* Message preview */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">Message Preview</p>
            <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{message}</pre>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {waUrl ? (
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2">
                  <Send className="w-4 h-4" />
                  Send via WhatsApp
                </Button>
              </a>
            ) : (
              <Button disabled className="w-full gap-2 bg-green-600 text-white opacity-50">
                <Send className="w-4 h-4" />
                Send via WhatsApp (no phone registered)
              </Button>
            )}

            {smsUrl ? (
              <a href={smsUrl}>
                <Button variant="outline" className="w-full gap-2 border-blue-400 text-blue-700 hover:bg-blue-50">
                  <Smartphone className="w-4 h-4" />
                  Send via SMS
                </Button>
              </a>
            ) : (
              <Button disabled variant="outline" className="w-full gap-2 opacity-50">
                <Smartphone className="w-4 h-4" />
                Send via SMS (no phone registered)
              </Button>
            )}

            <Button variant="outline" onClick={handleCopy} className="w-full gap-2">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Message'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Opens WhatsApp or SMS pre-filled with this message to the parent's number.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}