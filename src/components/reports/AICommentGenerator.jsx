import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';

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

const BAND_LABELS = {
  EE1: 'Exceeding Expectations (EE1)',
  EE2: 'Exceeding Expectations (EE2)',
  ME1: 'Meeting Expectations (ME1)',
  ME2: 'Meeting Expectations (ME2)',
  AE1: 'Approaching Expectations (AE1)',
  AE2: 'Approaching Expectations (AE2)',
  BE1: 'Below Expectations (BE1)',
  BE2: 'Below Expectations (BE2)',
};

function getTotal(student) {
  return SUBJECTS.reduce((sum, s) => sum + (Number(student[s.key]) || 0), 0);
}

function buildSubjectSummary(student) {
  return SUBJECTS
    .map(s => {
      const mark = student[s.key];
      const band = student[`${s.key}_band`];
      if (mark === null || mark === undefined || mark === '') return null;
      return `${s.label}: ${mark}/100 (${BAND_LABELS[band] || band || 'N/A'})`;
    })
    .filter(Boolean)
    .join(', ');
}

export default function AICommentGenerator({ student, onCommentGenerated }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async () => {
    setIsGenerating(true);

    const total = getTotal(student);
    const avg = (total / SUBJECTS.length).toFixed(1);
    const overallBand = student.overall_band || '';
    const subjectSummary = buildSubjectSummary(student);

    const prompt = `
You are an experienced CBC (Competency-Based Curriculum) class teacher in Kenya writing a formal, personalized end-of-term report card comment for a learner.

Student Name: ${student.name}
Grade: ${student.grade}
Term: ${student.term}
Exam Type: ${student.exam_type}
Class Average Score: ${avg}/100
Overall Performance Band: ${BAND_LABELS[overallBand] || overallBand || 'Not specified'}

Subject Performance Summary:
${subjectSummary || 'Marks not available.'}

Write a detailed class teacher's report card comment that:
1. Is written in formal, professional teacher language
2. Is 5–6 sentences long
3. Addresses the student by their first name (${student.name.split(' ')[0]})
4. References their academic performance across subjects, specifically mentioning strong and weak areas
5. Comments on key CBC competencies such as critical thinking, communication, collaboration, and problem-solving
6. Mentions the learner's attitude, participation, and effort during the term
7. Identifies one or two clear areas requiring improvement
8. Ends with a specific, constructive recommendation for the next term
9. Is encouraging and positive, even for low-performing learners
10. Is aligned with Kenyan CBC reporting standards
11. Does NOT use bullet points or numbered lists — write in continuous prose paragraphs only

Write only the comment text, nothing else.
    `.trim();

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    onCommentGenerated(result.trim());
    setIsGenerating(false);
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={generate}
      disabled={isGenerating}
      className="gap-1.5 text-primary border-primary/40 hover:bg-primary/5 text-xs h-7"
    >
      {isGenerating ? (
        <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
      ) : (
        <><Sparkles className="w-3 h-3" /> AI Generate</>
      )}
    </Button>
  );
}