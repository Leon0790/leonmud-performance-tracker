// Shared pricing + fulfilment for platform subscriptions and lesson-plan entitlements.
// Used by the payments and mpesaCallback functions so nothing is duplicated.

export const PRICES = {
  lessonPlan: 100, // per teacher, per learning area, per term
  monthly: 500, // per teacher
  annual: 5500, // per teacher
};

export const LEARNING_AREAS = [
  'Mathematics', 'English', 'Kiswahili', 'Integrated Science', 'Agriculture',
  'Social Studies', 'Pre-Technical Studies', 'Religious Studies', 'Creative Arts',
  'Business Studies', 'Literacy', 'Numeracy', 'Environmental Activities',
  'Hygiene & Nutrition', 'Movement & Creative Arts', 'Science & Technology',
  'Home Science', 'Religious Education', 'Creative Arts & Sports',
];

export function normalizePhone(input) {
  const digits = String(input || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('254') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return '';
}

/** Price a purchase server-side so the amount can never be chosen by the caller. */
export function pricePurchase(body) {
  const category = body.category;
  const targets = Array.isArray(body.target_emails) ? body.target_emails.filter(Boolean) : [];

  if (category === 'lesson_plan') {
    const areas = Array.isArray(body.learning_areas)
      ? body.learning_areas.filter(Boolean)
      : (body.learning_area ? [body.learning_area] : []);
    if (!areas.length) return { error: 'Select at least one learning area' };
    if (!targets.length) return { error: 'Select at least one teacher' };
    if (!body.term) return { error: 'Select a term' };
    if (!body.academic_year) return { error: 'Select an academic year' };
    const units = areas.length * targets.length;
    return {
      category,
      amount: units * PRICES.lessonPlan,
      quantity: units,
      areas,
      targets,
      plan: units > 1 ? 'bulk' : 'single',
      notes: `Lesson plan access — ${body.term} ${body.academic_year} · ${areas.join(', ')} · ${targets.length} teacher(s)`,
    };
  }

  if (category === 'platform_subscription') {
    const plan = body.plan === 'annual' ? 'annual' : 'monthly';
    if (!targets.length) return { error: 'Select at least one teacher' };
    return {
      category,
      amount: targets.length * PRICES[plan],
      quantity: targets.length,
      areas: [],
      targets,
      plan,
      notes: `${plan === 'annual' ? 'Annual' : 'Monthly'} platform subscription · ${targets.length} teacher(s)`,
    };
  }

  return { error: 'Unknown payment category' };
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** Grants what the payment bought. Safe to call twice for the same payment. */
export async function fulfillPayment(sr, payment) {
  const granted = { entitlements: 0, licences: 0 };

  if (payment.category === 'lesson_plan') {
    const areas = payment.learning_areas?.length ? payment.learning_areas : (payment.learning_area ? [payment.learning_area] : []);
    const targets = payment.target_emails?.length ? payment.target_emails : [payment.beneficiary_email || payment.payer_email];
    const existing = await sr.entities.LessonPlanEntitlement.filter({
      term: payment.term,
      academic_year: payment.academic_year,
    }, undefined, 500);
    const existingItems = existing.items || existing;

    for (const email of targets) {
      for (const area of areas) {
        const already = existingItems.find((e) => e.teacher_email === email && e.learning_area === area && e.status !== 'revoked');
        if (already) continue;
        await sr.entities.LessonPlanEntitlement.create({
          school_id: payment.school_id || '',
          teacher_email: email,
          learning_area: area,
          term: payment.term,
          academic_year: payment.academic_year,
          amount: PRICES.lessonPlan,
          source: payment.payer_email === email ? 'teacher_purchase' : 'school_purchase',
          payment_id: payment.id,
          purchased_by_email: payment.payer_email,
          status: 'active',
        });
        granted.entitlements += 1;
      }
    }
  }

  if (payment.category === 'platform_subscription') {
    const targets = payment.target_emails?.length ? payment.target_emails : [payment.beneficiary_email || payment.payer_email];
    const months = payment.plan === 'annual' ? 12 : 1;
    const start = new Date();
    const end = addMonths(start, months);
    for (const email of targets) {
      const licences = await sr.entities.PlatformLicence.filter({ teacher_email: email }, '-period_end', 20);
      const items = licences.items || licences;
      const active = items.find((l) => l.status === 'active' && new Date(l.period_end) > new Date());
      const periodStart = active ? new Date(active.period_end) : start;
      const periodEnd = addMonths(periodStart, months);
      await sr.entities.PlatformLicence.create({
        school_id: payment.school_id || '',
        teacher_email: email,
        plan: payment.plan === 'annual' ? 'annual' : 'monthly',
        amount: PRICES[payment.plan === 'annual' ? 'annual' : 'monthly'],
        payment_id: payment.id,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        purchased_by_email: payment.payer_email,
        status: 'active',
      });
      granted.licences += 1;
    }
  }

  return granted;
}

export function receiptNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LM-${stamp}-${rand}`;
}