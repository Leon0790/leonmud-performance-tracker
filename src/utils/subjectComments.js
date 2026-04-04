// Auto-generated comments per subject based on performance band

const COMMENTS = {
  EE1: [
    'Outstanding performance. Keep up the excellent work!',
    'Exceptional achievement. A role model for peers.',
    'Excellent mastery of concepts. Highly commendable.',
  ],
  EE2: [
    'Excellent performance. Continue to strive for the best.',
    'Very strong grasp of the subject. Well done!',
    'Excellent work. Maintain this high standard.',
  ],
  ME1: [
    'Good performance. Work on a few areas to reach the top.',
    'Meets expectations well. A little more effort will make a big difference.',
    'Good understanding shown. Keep pushing higher.',
  ],
  ME2: [
    'Satisfactory performance. More consistent effort needed.',
    'Meets the basic standard. Aim higher next term.',
    'Adequate performance. Focus on improving weak areas.',
  ],
  AE1: [
    'Approaching expectations. More practice and revision required.',
    'Shows some understanding but needs to work harder.',
    'Getting there — put in more effort and seek help when needed.',
  ],
  AE2: [
    'Below expectations. Needs significant improvement.',
    'Struggling in key areas. Extra support is recommended.',
    'Requires more attention and regular revision.',
  ],
  BE1: [
    'Performance is very low. Urgent intervention is needed.',
    'Serious gaps in understanding. Please seek teacher guidance.',
    'Must dedicate more time to study and practice.',
  ],
  BE2: [
    'Critical performance level. Immediate remedial action required.',
    'Very poor performance. Parental involvement is strongly advised.',
    'Needs intensive support and extra tuition urgently.',
  ],
};

// Subject-specific prefix phrases
const SUBJECT_PREFIXES = {
  mathematics: 'In Mathematics',
  english: 'In English',
  kiswahili: 'In Kiswahili',
  integrated_science: 'In Integrated Science',
  agriculture: 'In Agriculture',
  social_studies: 'In Social Studies',
  pretechnical_studies: 'In Pre-Technical Studies',
  religious_studies: 'In Religious Studies',
  creative_art: 'In Creative Art',
};

/**
 * Returns an automated comment for a given subject and band.
 * Uses a deterministic pick based on subject key so each subject gets a different phrase.
 */
export function getSubjectComment(subjectKey, band) {
  if (!band) return '—';
  const pool = COMMENTS[band];
  if (!pool) return '—';
  // Pick deterministically based on subject position
  const keys = Object.keys(SUBJECT_PREFIXES);
  const idx = keys.indexOf(subjectKey) % pool.length;
  const prefix = SUBJECT_PREFIXES[subjectKey] || 'In this subject';
  return `${prefix}: ${pool[idx]}`;
}