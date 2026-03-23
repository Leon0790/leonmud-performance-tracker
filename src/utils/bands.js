export function getBand(score) {
  if (score === null || score === undefined || score === '') return '';
  const n = Number(score);
  if (n >= 90) return 'EE1';
  if (n >= 75) return 'EE2';
  if (n >= 58) return 'ME1';
  if (n >= 41) return 'ME2';
  if (n >= 31) return 'AE1';
  if (n >= 21) return 'AE2';
  if (n >= 11) return 'BE1';
  if (n >= 1)  return 'BE2';
  return 'BE2';
}

export function bandColor(band) {
  if (band === 'EE1' || band === 'EE2') return '#16a34a';
  if (band === 'ME1' || band === 'ME2') return '#2563eb';
  if (band === 'AE1' || band === 'AE2') return '#d97706';
  if (band === 'BE1' || band === 'BE2') return '#dc2626';
  return '#000';
}

export function bandRGB(band) {
  if (band === 'EE1' || band === 'EE2') return [22, 163, 74];
  if (band === 'ME1' || band === 'ME2') return [37, 99, 235];
  if (band === 'AE1' || band === 'AE2') return [217, 119, 6];
  if (band === 'BE1' || band === 'BE2') return [220, 38, 38];
  return [0, 0, 0];
}

export function bandTailwindColor(band) {
  if (band === 'EE1' || band === 'EE2') return 'text-green-700 bg-green-50';
  if (band === 'ME1' || band === 'ME2') return 'text-blue-700 bg-blue-50';
  if (band === 'AE1' || band === 'AE2') return 'text-amber-700 bg-amber-50';
  if (band === 'BE1' || band === 'BE2') return 'text-red-700 bg-red-50';
  return '';
}

export const ALL_BANDS = ['EE1', 'EE2', 'ME1', 'ME2', 'AE1', 'AE2', 'BE1', 'BE2'];