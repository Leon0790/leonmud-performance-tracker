import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { ensureLessonAccess } from '@/lib/lessonAccess';

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

// Step durations as fractions of total
const STEP_FRACTIONS = { introduction: 0.125, grapple: 0.125, mini_lesson: 0.325, guided_practice: 0.25, work_time: 0.10, debrief: 0.075 };

export default function LessonPlanGeneratorV2({ user, onGenerated, onBack }) {
  const [form, setForm] = useState({
    grade: 'Grade 7',
    subject: 'Pre-Technical Studies',
    term: 'Term 1',
    week: 1,
    lesson: 1,
    duration: 40,
    big_idea: '',
    strand: '',
    sub_strand: '',
    school_name: '',
    teacher_name: '',
  });
  const [generating, setGenerating] = useState(false);

  const subjects = GRADE_SUBJECTS[form.grade] || GRADE_SUBJECTS['Grade 7'];
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const getStepMins = () => {
    const d = Number(form.duration) || 40;
    const s = {};
    let used = 0;
    const keys = Object.keys(STEP_FRACTIONS);
    keys.forEach((k, i) => {
      if (i === keys.length - 1) {
        s[k] = d - used;
      } else {
        s[k] = Math.round(d * STEP_FRACTIONS[k]);
        used += s[k];
      }
    });
    return s;
  };

  const handleGenerate = async () => {
    if (!form.big_idea && !form.strand) {
      toast({ title: 'Please enter a Big Idea or Strand / Topic', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const access = await ensureLessonAccess(user, form.subject, form.term);
      if (!access.ok) {
        toast({
          title: 'Lesson plan access needed',
          description: `Buy ${form.subject} — ${form.term} access for KSh 100 to generate this plan.`,
          variant: 'destructive',
        });
        return;
      }
      const mins = getStepMins();
      const prompt = `You are a Kenya CBE (Competency Based Education) lesson plan generator using the Big Idea / Grapple format for ${form.grade} ${form.subject}, ${form.term}, Week ${form.week}, Lesson ${form.lesson}.

Lesson Duration: ${form.duration} minutes
Big Idea: ${form.big_idea || form.strand}
Strand: ${form.strand || form.big_idea}
Sub Strand: ${form.sub_strand || '(generate an appropriate sub strand)'}

Generate a complete V2 lesson plan with these timed steps:
- Introduction (${mins.introduction} min): Hook activity, short video or engaging opener. Include a Strategic Question and TPT (Think, Pair, Share).
- Grapple (${mins.grapple} min): Introduce a real-world scenario/problem. Strategic Question. Students brainstorm in pairs.
- Mini-Lesson (${mins.mini_lesson} min): Direct instruction — define key concepts, explain, highlight local examples.
- Guided Practice (${mins.guided_practice} min): Group activity with guiding questions/worksheet.
- Work-Time (${mins.work_time} min): Individual/creative task (paragraph, poster, diagram).
- Debrief (${mins.debrief} min): Share out, closing question, self-reflection.

Use this JSON schema:
{
  "title": "short descriptive title",
  "strand": "strand name",
  "sub_strand": "sub strand name",
  "big_idea": "the overarching big idea/theme",
  "mission_vision": "Create [skills/values]. e.g. Create real world and critical thinking skills, self-efficacy.",
  "lesson_target": "I can... statement that the learner will achieve",
  "learning_resources": "list of materials needed",
  "core_competency": "list the CBE core competencies addressed e.g. Critical thinking, Communication, Creativity, Citizenship",
  "v2_introduction": "${mins.introduction}-minute introduction step content including strategic question and TPT activity",
  "v2_grapple": "${mins.grapple}-minute grapple scenario, strategic question, pair brainstorm",
  "v2_mini_lesson": "${mins.mini_lesson}-minute direct instruction content",
  "v2_guided_practice": "${mins.guided_practice}-minute guided group activity with guiding questions",
  "v2_work_time": "${mins.work_time}-minute individual/creative task instructions",
  "v2_debrief": "${mins.debrief}-minute debrief, sharing and self-reflection prompt"
}

Make it CBE-aligned, practical, and age-appropriate for ${form.grade}. Return ONLY the JSON object.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            strand: { type: 'string' },
            sub_strand: { type: 'string' },
            big_idea: { type: 'string' },
            mission_vision: { type: 'string' },
            lesson_target: { type: 'string' },
            learning_resources: { type: 'string' },
            core_competency: { type: 'string' },
            v2_introduction: { type: 'string' },
            v2_grapple: { type: 'string' },
            v2_mini_lesson: { type: 'string' },
            v2_guided_practice: { type: 'string' },
            v2_work_time: { type: 'string' },
            v2_debrief: { type: 'string' },
          },
        },
      });

      const planData = {
        plan_version: 'v2',
        grade: form.grade,
        subject: form.subject,
        term: form.term,
        week: Number(form.week),
        lesson: Number(form.lesson),
        duration: Number(form.duration) || 40,
        school_name: form.school_name,
        teacher_name: form.teacher_name,
        teacher_email: user?.email || '',
        school_id: access.school_id || undefined,
        subscription_type: 'monthly',
        title: result.title || `${form.subject} — ${result.big_idea || form.big_idea}`,
        strand: result.strand || form.strand || form.big_idea,
        sub_strand: result.sub_strand || form.sub_strand,
        big_idea: result.big_idea || form.big_idea,
        mission_vision: result.mission_vision || '',
        lesson_target: result.lesson_target || '',
        learning_resources: result.learning_resources || '',
        core_competency: result.core_competency || '',
        v2_introduction: result.v2_introduction || '',
        v2_grapple: result.v2_grapple || '',
        v2_mini_lesson: result.v2_mini_lesson || '',
        v2_guided_practice: result.v2_guided_practice || '',
        v2_work_time: result.v2_work_time || '',
        v2_debrief: result.v2_debrief || '',
        reflection: '',
      };

      const saved = await base44.entities.LessonPlan.create(planData);
      toast({ title: 'V2 Lesson plan generated!', description: 'You can now edit and download it.' });
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
          <h2 className="text-xl font-bold">Generate Lesson Plan — Version 2</h2>
          <p className="text-xs text-muted-foreground">Big Idea · Grapple · Mini-Lesson · Guided Practice · Work-Time · Debrief</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Plan Details</CardTitle></CardHeader>
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
            <div>
              <Label className="text-xs text-muted-foreground">Lesson Duration (minutes)</Label>
              <Select value={String(form.duration)} onValueChange={v => set('duration', Number(v))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['30','35','40','45','60','70','80'].map(v => (
                    <SelectItem key={v} value={v}>{v} minutes</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Big Idea / Theme <span className="text-destructive">*</span></Label>
            <Input className="mt-1" placeholder="e.g. ENTREPRENEURSHIP" value={form.big_idea} onChange={e => set('big_idea', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Strand</Label>
            <Input className="mt-1" placeholder="e.g. Entrepreneurship" value={form.strand} onChange={e => set('strand', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Sub Strand (optional)</Label>
            <Input className="mt-1" placeholder="e.g. Meaning of entrepreneur" value={form.sub_strand} onChange={e => set('sub_strand', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">School Name (optional)</Label>
              <Input className="mt-1" placeholder="e.g. Sunrise Primary School" value={form.school_name} onChange={e => set('school_name', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Teacher Name (optional)</Label>
              <Input className="mt-1" placeholder="e.g. Tr. Leonard" value={form.teacher_name} onChange={e => set('teacher_name', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full gap-2 h-11" onClick={handleGenerate} disabled={generating}>
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {generating ? 'Generating V2 lesson plan...' : 'Generate V2 Lesson Plan with AI'}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Format: Introduction → Grapple → Mini-Lesson → Guided Practice → Work-Time → Debrief
      </p>
    </div>
  );
}