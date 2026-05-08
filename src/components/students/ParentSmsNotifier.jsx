import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MessageSquare, Phone, AlertTriangle, CalendarClock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

const SUBJECTS = [
  { key: 'mathematics', label: 'Mathematics' },
  { key: 'english', label: 'English' },
  { key: 'kiswahili', label: 'Kiswahili' },
  { key: 'integrated_science', label: 'Integrated Science' },
  { key: 'agriculture', label: 'Agriculture' },
  { key: 'social_studies', label: 'Social Studies' },
  { key: 'pretechnical_studies', label: 'Pre-Technical Studies' },
  { key: 'religious_studies', label: 'Religious Studies' },
  { key: 'creative_art', label: 'Creative Art' },
];

const LOW_MARK_THRESHOLD = 50;

function getLowSubjects(marksRecord) {
  if (!marksRecord) return [];
  return SUBJECTS.filter(s => {
    const v = Number(marksRecord[s.key]);
    return !isNaN(v) && v > 0 && v < LOW_MARK_THRESHOLD;
  }).map(s => ({ label: s.label, mark: marksRecord[s.key] }));
}

function getMostRecentMarks(marksRecords) {
  if (!marksRecords?.length) return null;
  return [...marksRecords].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))[0];
}

export default function ParentSmsNotifier({ student, marksRecords }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [type, setType] = useState('low_marks'); // 'low_marks' | 'exam_reminder'
  const [examDate, setExamDate] = useState('');
  const [examName, setExamName] = useState('Mid Term');
  const [customMsg, setCustomMsg] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const parentPhone = student?.parent_phone?.replace(/\s+/g, '').replace(/^0/, '254');
  const hasPhone = !!parentPhone;

  const recentMarks = useMemo(() => getMostRecentMarks(marksRecords), [marksRecords]);
  const lowSubjects = useMemo(() => getLowSubjects(recentMarks), [recentMarks]);

  const buildDefaultMessage = () => {
    const name = `${student.first_name} ${student.last_name}`;
    const parent = student.parent_name || 'Parent/Guardian';
    if (type === 'low_marks') {
      if (!lowSubjects.length) {
        return `Dear ${parent}, this is a message regarding ${name}'s academic performance. Please contact the school for details.`;
      }
      const subjectList = lowSubjects.map(s => `${s.label} (${s.mark}/100)`).join(', ');
      return `Dear ${parent}, ${name} scored below 50 in the following subject(s): ${subjectList}. Please encourage extra study at home. Contact us for support. - ${student.class_name || 'School'}`;
    } else {
      const dateStr = examDate ? new Date(examDate + 'T12:00:00').toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' }) : '___';
      return `Dear ${parent}, this is a reminder that ${name}'s ${examName} exam is scheduled for ${dateStr}. Please ensure your child is well prepared. - ${student.class_name || 'School'}`;
    }
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    const name = `${student.first_name} ${student.last_name}`;
    const parent = student.parent_name || 'Parent/Guardian';
    let prompt = '';
    if (type === 'low_marks') {
      const subjectList = lowSubjects.length
        ? lowSubjects.map(s => `${s.label}: ${s.mark}/100`).join(', ')
        : 'several subjects';
      prompt = `Write a short, polite SMS (max 160 chars) to a parent named "${parent}" about their child "${name}" who is struggling in: ${subjectList}. Encourage home support. Sign off with "School".`;
    } else {
      const dateStr = examDate || 'an upcoming date';
      prompt = `Write a short, polite SMS (max 160 chars) to a parent named "${parent}" reminding them their child "${name}" has a ${examName} exam on ${dateStr}. Encourage preparation. Sign off with "School".`;
    }
    const msg = await base44.integrations.Core.InvokeLLM({ prompt });
    setCustomMsg(msg);
    setUseAI(true);
    setIsGenerating(false);
  };

  const finalMessage = useAI && customMsg ? customMsg : (customMsg || buildDefaultMessage());

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(finalMessage);
    window.open(`https://wa.me/${parentPhone}?text=${encoded}`, '_blank');
    toast({ title: 'WhatsApp opened with pre-filled message.' });
  };

  const handleSendSMS = () => {
    const encoded = encodeURIComponent(finalMessage);
    window.location.href = `sms:${parentPhone}?body=${encoded}`;
    toast({ title: 'SMS app opened.' });
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Notify Parent via SMS / WhatsApp
          </CardTitle>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {!hasPhone && (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              No parent phone number on file. Add one in Edit mode.
            </div>
          )}

          {/* Notification type */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setType('low_marks')}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-sm font-medium transition-all ${type === 'low_marks' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
            >
              <AlertTriangle className="w-5 h-5" />
              Low Marks Alert
            </button>
            <button
              onClick={() => setType('exam_reminder')}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-sm font-medium transition-all ${type === 'exam_reminder' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
            >
              <CalendarClock className="w-5 h-5" />
              Exam Reminder
            </button>
          </div>

          {/* Low marks summary */}
          {type === 'low_marks' && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              {lowSubjects.length > 0 ? (
                <>
                  <p className="font-medium text-destructive mb-1.5">Subjects below 50:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lowSubjects.map(s => (
                      <span key={s.label} className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">{s.label}: {s.mark}</span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No subjects below 50 in the most recent exam. You can still send a general message.</p>
              )}
            </div>
          )}

          {/* Exam reminder fields */}
          {type === 'exam_reminder' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Exam Name</Label>
                <select
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                  className="flex h-9 w-full mt-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option>Mid Term</option>
                  <option>End Term</option>
                  <option>CAT</option>
                  <option>Mock Exam</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Exam Date</Label>
                <input
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  className="flex h-9 w-full mt-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {/* Message preview & editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Message Preview</Label>
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline disabled:opacity-60"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : '✨'}
                {isGenerating ? 'Generating...' : 'AI Generate'}
              </button>
            </div>
            <textarea
              className="w-full text-sm border border-input rounded-md px-3 py-2 resize-none bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              rows={4}
              value={finalMessage}
              onChange={e => { setCustomMsg(e.target.value); setUseAI(false); }}
            />
            <p className="text-xs text-muted-foreground mt-1">{finalMessage.length} characters</p>
          </div>

          {/* Send buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleSendWhatsApp}
              disabled={!hasPhone}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button
              onClick={handleSendSMS}
              disabled={!hasPhone}
              variant="outline"
              className="gap-2"
            >
              <Phone className="w-4 h-4" />
              SMS
            </Button>
          </div>

          {hasPhone && (
            <p className="text-xs text-muted-foreground text-center">
              Sending to: <span className="font-mono font-medium">{student.parent_phone}</span>
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}