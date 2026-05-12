import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9'];
const TERMS = ['Term 1','Term 2','Term 3'];

const GRADE_SUBJECTS = {
  'Grade 1': ['Mathematics','English','Kiswahili','Literacy','Numeracy','Environmental Activities','Hygiene & Nutrition','Movement & Creative Arts','Religious Education'],
  'Grade 2': ['Mathematics','English','Kiswahili','Literacy','Numeracy','Environmental Activities','Hygiene & Nutrition','Movement & Creative Arts','Religious Education'],
  'Grade 3': ['Mathematics','English','Kiswahili','Literacy','Numeracy','Environmental Activities','Hygiene & Nutrition','Movement & Creative Arts','Religious Education'],
  'Grade 4': ['Mathematics','English','Kiswahili','Science & Technology','Social Studies','Home Science','Agriculture','Religious Education','Creative Arts & Sports'],
  'Grade 5': ['Mathematics','English','Kiswahili','Science & Technology','Social Studies','Home Science','Agriculture','Religious Education','Creative Arts & Sports'],
  'Grade 6': ['Mathematics','English','Kiswahili','Science & Technology','Social Studies','Home Science','Agriculture','Religious Education','Creative Arts & Sports'],
  'Grade 7': ['Mathematics','English','Kiswahili','Integrated Science','Agriculture','Social Studies','Pre-Technical Studies','Religious Studies','Creative Arts'],
  'Grade 8': ['Mathematics','English','Kiswahili','Integrated Science','Agriculture','Social Studies','Pre-Technical Studies','Religious Studies','Creative Arts','Business Studies'],
  'Grade 9': ['Mathematics','English','Kiswahili','Integrated Science','Agriculture','Social Studies','Pre-Technical Studies','Religious Studies','Creative Arts','Business Studies'],
};

export default function LessonPlanGenerator({ user, onGenerated, onBack }) {
  const [form, setForm] = useState({
    grade: 'Grade 7',
    subject: 'Mathematics',
    term: 'Term 1',
    week: 1,
    lesson: 1,
    strand: '',
    sub_strand: '',
    school_name: '',
  });
  const [generating, setGenerating] = useState(false);

  const subjects = GRADE_SUBJECTS[form.grade] || GRADE_SUBJECTS['Grade 7'];

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleGenerate = async () => {
    if (!form.strand) {
      toast({ title: 'Please enter a Strand / Topic', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const prompt = `You are a Kenya CBC (Competency Based Curriculum) lesson plan generator for ${form.grade} ${form.subject}, ${form.term}, Week ${form.week}, Lesson ${form.lesson}.

Strand: ${form.strand}
Sub Strand: ${form.sub_strand || '(generate an appropriate sub strand)'}

Generate a complete lesson plan following the exact CBC format used in Kenya schools. Use this JSON schema:

{
  "title": "short descriptive title",
  "strand": "strand name",
  "sub_strand": "sub strand name",
  "specific_outcomes": "By the end of the lesson, the learner should be able to:\na) ...\nb) ...\nc) ...",
  "key_inquiry_question": "A single key inquiry question",
  "learning_resources": "Learner's book, relevant materials, digital devices etc.",
  "organization_of_learning": "In the Classroom: individual, in pairs and group work.",
  "introduction": "5-minute introduction — what the teacher says/does to introduce the lesson",
  "lesson_development": "Step 1\\n[20-minute description]\\n\\nStep 2\\n[description]\\n\\nStep 3\\n[description]\\n\\nExtended Activities\\n[homework activity for learners with parent/guardian]",
  "conclusion": "5-minute conclusion — closing question the teacher asks learners"
}

Make it age-appropriate for ${form.grade}, CBC-aligned, activity-based with group work, pairs, and individual tasks. The extended activity should involve using the internet or working with a parent/guardian at home. Return ONLY the JSON object.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            strand: { type: 'string' },
            sub_strand: { type: 'string' },
            specific_outcomes: { type: 'string' },
            key_inquiry_question: { type: 'string' },
            learning_resources: { type: 'string' },
            organization_of_learning: { type: 'string' },
            introduction: { type: 'string' },
            lesson_development: { type: 'string' },
            conclusion: { type: 'string' },
          },
        },
      });

      const planData = {
        ...form,
        week: Number(form.week),
        lesson: Number(form.lesson),
        teacher_email: user?.email || '',
        title: result.title || `${form.subject} — ${result.strand || form.strand}`,
        strand: result.strand || form.strand,
        sub_strand: result.sub_strand || form.sub_strand,
        specific_outcomes: result.specific_outcomes || '',
        key_inquiry_question: result.key_inquiry_question || '',
        learning_resources: result.learning_resources || '',
        organization_of_learning: result.organization_of_learning || 'In the Classroom: individual, in pairs and group work.',
        introduction: result.introduction || '',
        lesson_development: result.lesson_development || '',
        extended_activities: '',
        conclusion: result.conclusion || '',
        reflection: '',
        subscription_type: 'monthly',
      };

      const saved = await base44.entities.LessonPlan.create(planData);
      toast({ title: 'Lesson plan generated!', description: 'You can now edit and download it.' });
      onGenerated(saved);
    } catch (e) {
      toast({ title: 'Generation failed', description: String(e), variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h2 className="text-xl font-bold">Generate Lesson Plan</h2>
          <p className="text-xs text-muted-foreground">AI-powered CBC lesson plan generation</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Plan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Grade</Label>
              <Select value={form.grade} onValueChange={v => { set('grade', v); set('subject', GRADE_SUBJECTS[v]?.[0] || 'Mathematics'); }}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Subject / Learning Area</Label>
              <Select value={form.subject} onValueChange={v => set('subject', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Term</Label>
              <Select value={form.term} onValueChange={v => set('term', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Week</Label>
                <Input type="number" min={1} max={13} className="mt-1" value={form.week} onChange={e => set('week', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Lesson</Label>
                <Input type="number" min={1} max={5} className="mt-1" value={form.lesson} onChange={e => set('lesson', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Strand / Main Topic <span className="text-destructive">*</span></Label>
            <Input className="mt-1" placeholder="e.g. Measurement; Length" value={form.strand} onChange={e => set('strand', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Sub Strand (optional — AI will generate if blank)</Label>
            <Input className="mt-1" placeholder="e.g. Converting units of length" value={form.sub_strand} onChange={e => set('sub_strand', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">School Name (optional)</Label>
            <Input className="mt-1" placeholder="e.g. Sunrise Primary School" value={form.school_name} onChange={e => set('school_name', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Button className="w-full gap-2 h-11" onClick={handleGenerate} disabled={generating}>
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {generating ? 'Generating your lesson plan...' : 'Generate Lesson Plan with AI'}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        The AI generates a complete CBC-formatted lesson plan which you can then customise and download as PDF.
      </p>
    </div>
  );
}