// Subject definitions for the junior secondary mark table (paper-based subjects).

export const SIMPLE_SUBJECTS = [
  { key: 'mathematics', label: 'Maths', max: 100 },
  { key: 'agriculture', label: 'Agri.', max: 100 },
  { key: 'social_studies', label: 'S.Studies', max: 100 },
  { key: 'pretechnical_studies', label: 'Pre-Tech', max: 100 },
  { key: 'religious_studies', label: 'Religious', max: 100 },
  { key: 'creative_art', label: 'Art', max: 100 },
];

export const PAPER_SUBJECTS = [
  {
    key: 'kiswahili',
    label: 'Kiswahili',
    papers: [
      { pkey: 'kiswahili_p1', label: 'P1', max: 50 },
      { pkey: 'kiswahili_p2', label: 'P2', max: 50 },
    ],
  },
  {
    key: 'english',
    label: 'English',
    papers: [
      { pkey: 'english_p1', label: 'P1', max: 50 },
      { pkey: 'english_p2', label: 'P2', max: 50 },
    ],
  },
  {
    key: 'integrated_science',
    label: 'Int. Science',
    papers: [
      { pkey: 'integrated_science_p1', label: 'P1', max: 70 },
      { pkey: 'integrated_science_p2', label: 'P2', max: 30 },
    ],
  },
];

export const MARK_SUBJECT_COUNT = PAPER_SUBJECTS.length + SIMPLE_SUBJECTS.length;

export function calcPaperTotal(marks, subject) {
  return subject.papers.reduce((sum, p) => sum + (parseInt(marks[p.pkey]) || 0), 0);
}