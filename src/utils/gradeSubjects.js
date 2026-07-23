/**
 * All available learning areas across all CBC grades.
 * Each entry has: key (matches Student entity field), label, defaultGrades (which grades include it by default)
 */
export const ALL_SUBJECTS = [
  // Lower Primary (Grades 1-3)
  { key: 'literacy',                   label: 'Literacy',                    defaultGrades: ['Grade 1','Grade 2','Grade 3'] },
  { key: 'numeracy',                   label: 'Numeracy',                    defaultGrades: ['Grade 1','Grade 2','Grade 3'] },
  { key: 'environmental_activities',   label: 'Environmental Activities',    defaultGrades: ['Grade 1','Grade 2','Grade 3'] },
  { key: 'hygiene_nutrition',          label: 'Hygiene & Nutrition',         defaultGrades: ['Grade 1','Grade 2','Grade 3'] },
  { key: 'movement_creative_arts',     label: 'Movement & Creative Arts',    defaultGrades: ['Grade 1','Grade 2','Grade 3'] },
  { key: 'religious_studies',          label: 'Religious Studies',           defaultGrades: ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6'] },

  // Upper Primary (Grades 4-6)
  { key: 'mathematics',                        label: 'Mathematics',                          defaultGrades: ['Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9'] },
  { key: 'english',                            label: 'English',                              defaultGrades: ['Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9'] },
  { key: 'kiswahili',                          label: 'Kiswahili',                            defaultGrades: ['Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9'] },
  { key: 'science_technology',                 label: 'Science & Technology',                 defaultGrades: ['Grade 4'] },
  { key: 'science_technology_agriculture',     label: 'Science, Technology & Agriculture',   defaultGrades: ['Grade 5','Grade 6'] },
  { key: 'social_studies',                     label: 'Social Studies',                       defaultGrades: ['Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9'] },
  { key: 'agriculture',                        label: 'Agriculture',                          defaultGrades: ['Grade 4','Grade 7','Grade 8','Grade 9'] },
  { key: 'home_science',                       label: 'Home Science',                         defaultGrades: ['Grade 4','Grade 5','Grade 6'] },
  { key: 'psychomotor_creative_arts',          label: 'Psychomotor & Creative Arts',          defaultGrades: ['Grade 4','Grade 5','Grade 6'] },
  { key: 'business_studies',                   label: 'Business Studies',                     defaultGrades: ['Grade 4','Grade 5','Grade 6'] },

  // JSS (Grades 7-9)
  { key: 'integrated_science',         label: 'Integrated Science',          defaultGrades: ['Grade 7','Grade 8','Grade 9'] },
  { key: 'pretechnical_studies',       label: 'Pre-Technical Studies',       defaultGrades: ['Grade 7','Grade 8','Grade 9'] },
  { key: 'creative_art',               label: 'Creative Art',                defaultGrades: ['Grade 7','Grade 8','Grade 9'] },
];

export const ALL_GRADES = [
  'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6',
  'Grade 7','Grade 8','Grade 9'
];

export const JUNIOR_SECONDARY = ['Grade 7','Grade 8','Grade 9'];

export function isJuniorSecondary(grade) {
  return JUNIOR_SECONDARY.includes(grade);
}

export function getDefaultSubjectsForGrade(grade) {
  return ALL_SUBJECTS.filter(s => s.defaultGrades.includes(grade)).map(s => s.key);
}

export function getSubjectByKey(key) {
  return ALL_SUBJECTS.find(s => s.key === key);
}