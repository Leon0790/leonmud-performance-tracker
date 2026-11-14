const NAME_KEYS = ['name', 'student_name', 'student', 'full_name', 'names', 'learner_name', 'student_names', 'pupil_name'];
const ADMISSION_KEYS = ['admission_number', 'admission_no', 'adm_no', 'adm', 'admission', 'reg_no', 'registration_number'];

export function normalizeKeys(row) {
  const out = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    const clean = String(key)
      .toLowerCase()
      .trim()
      .replace(/[\s.\-/]+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    out[clean] = typeof value === 'string' ? value.trim() : value;
  });
  return out;
}

export function pickName(row) {
  const r = normalizeKeys(row);
  for (const key of NAME_KEYS) {
    if (r[key]) return String(r[key]).trim();
  }
  const first = r.first_name || r.firstname;
  const last = r.last_name || r.surname;
  if (first || last) return `${first || ''} ${last || ''}`.trim();
  return '';
}

export function pickAdmission(row) {
  const r = normalizeKeys(row);
  for (const key of ADMISSION_KEYS) {
    if (r[key]) return String(r[key]).trim();
  }
  return '';
}

export function splitName(full) {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: '', last_name: '' };
  if (parts.length === 1) return { first_name: parts[0], last_name: '' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

export function fullName(record) {
  return `${record?.first_name || ''} ${record?.last_name || ''}`.trim();
}