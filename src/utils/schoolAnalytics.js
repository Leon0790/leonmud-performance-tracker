// Small analytics helpers for the school (headteacher) dashboard.

export const SUBJECT_FIELDS = [
  ['mathematics', 'Mathematics'],
  ['english', 'English'],
  ['kiswahili', 'Kiswahili'],
  ['integrated_science', 'Integrated Science'],
  ['agriculture', 'Agriculture'],
  ['social_studies', 'Social Studies'],
  ['pretechnical_studies', 'Pre-Technical Studies'],
  ['religious_studies', 'Religious Studies'],
  ['creative_art', 'Creative Arts'],
  ['business_studies', 'Business Studies'],
  ['literacy', 'Literacy'],
  ['numeracy', 'Numeracy'],
];

export function studentScore(student) {
  const keys = student.subjects_config?.length
    ? SUBJECT_FIELDS.filter(([key]) => student.subjects_config.includes(key)).map(([key]) => key)
    : SUBJECT_FIELDS.map(([key]) => key);
  const marks = keys.map((key) => Number(student[key])).filter((n) => Number.isFinite(n) && n > 0);
  if (!marks.length) return null;
  return marks.reduce((a, b) => a + b, 0) / marks.length;
}

export function averageByGrade(students) {
  const bucket = {};
  students.forEach((s) => {
    const score = studentScore(s);
    if (score === null) return;
    if (!bucket[s.grade]) bucket[s.grade] = { total: 0, count: 0 };
    bucket[s.grade].total += score;
    bucket[s.grade].count += 1;
  });
  return Object.entries(bucket)
    .map(([grade, v]) => ({ name: grade, average: Math.round((v.total / v.count) * 10) / 10, learners: v.count }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

export function averageBySubject(students) {
  const bucket = {};
  students.forEach((s) => {
    SUBJECT_FIELDS.forEach(([key, label]) => {
      const value = Number(s[key]);
      if (!Number.isFinite(value) || value <= 0) return;
      if (!bucket[label]) bucket[label] = { total: 0, count: 0 };
      bucket[label].total += value;
      bucket[label].count += 1;
    });
  });
  return Object.entries(bucket)
    .map(([name, v]) => ({ name, average: Math.round((v.total / v.count) * 10) / 10 }))
    .sort((a, b) => b.average - a.average);
}

export function bandFor(score) {
  if (score >= 80) return 'EE';
  if (score >= 65) return 'ME';
  if (score >= 50) return 'AE';
  return 'BE';
}