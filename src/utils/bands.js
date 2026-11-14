// Grading system used across marks entry, report cards and mark lists:
// EE = 80–100%, ME = 65–79%, AE = 50–64%, BE = 0–49%

export const BANDS = [
  { code: 'EE', label: 'Exceeding Expectations', color: '#16a34a', rgb: [22, 163, 74], tailwind: 'text-green-700 bg-green-50', min: 80, max: 100 },
  { code: 'ME', label: 'Meeting Expectations', color: '#2563eb', rgb: [37, 99, 235], tailwind: 'text-blue-700 bg-blue-50', min: 65, max: 79 },
  { code: 'AE', label: 'Approaching Expectations', color: '#d97706', rgb: [217, 119, 6], tailwind: 'text-amber-700 bg-amber-50', min: 50, max: 64 },
  { code: 'BE', label: 'Below Expectations', color: '#dc2626', rgb: [220, 38, 38], tailwind: 'text-red-700 bg-red-50', min: 0, max: 49 },
];

export function getBand(score) {
  if (score === null || score === undefined || score === '') return '';
  const n = Number(score);
  if (Number.isNaN(n)) return '';
  if (n >= 80) return 'EE';
  if (n >= 65) return 'ME';
  if (n >= 50) return 'AE';
  return 'BE';
}

// Converts legacy two-tier codes (EE1, ME2, …) to the single-tier codes above
export function normalizeBand(band) {
  if (!band) return '';
  const b = String(band).toUpperCase();
  if (BANDS.some(x => x.code === b)) return b;
  return b.replace(/[12]$/, '');
}

function bandInfo(band) {
  const b = normalizeBand(band);
  return BANDS.find(x => x.code === b) || null;
}

export function bandColor(band) {
  return bandInfo(band)?.color || '#000';
}

export function bandRGB(band) {
  return bandInfo(band)?.rgb || [0, 0, 0];
}

export function bandTailwindColor(band) {
  return bandInfo(band)?.tailwind || '';
}

export const ALL_BANDS = BANDS.map(b => b.code);