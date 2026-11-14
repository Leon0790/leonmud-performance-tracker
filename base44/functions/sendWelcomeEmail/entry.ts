import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const ADMIN_NAME = 'Leonard Mudinyu';
const ADMIN_EMAIL = 'leonardmudinyu@gmail.com';
const APP_URL = 'https://leon-track-grade.base44.app';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Only teachers receive the welcome email, and only once.
    if (user.role === 'admin') return Response.json({ skipped: 'admin' });
    const users = await base44.asServiceRole.entities.User.filter({ email: user.email });
    const record = users[0];
    if (record && record.welcome_email_sent) return Response.json({ skipped: 'already-sent' });

    const name = (user.full_name || (user.email || '').split('@')[0] || 'Teacher').trim();
    const firstName = name.split(' ')[0];

    const body = `Dear ${firstName},

Your LeonMud Performance Tracker account is now active. Welcome aboard.

Here is what you can start doing right away:
- Register your learners, their classes and parent contact details
- Enter or import marks for every learning area, term and exam
- Prepare report cards, mark lists and progress reports
- Track attendance and share results with parents by SMS or WhatsApp
- Create lesson plans in the standard CBE or Big Idea format

Sign in any time: ${APP_URL}

If you need help at any point, simply reply to this email and it will reach the administrator, ${ADMIN_NAME} (${ADMIN_EMAIL}).

Warm regards,
${ADMIN_NAME}
Administrator, LeonMud Performance Tracker`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      from_name: `${ADMIN_NAME} - LeonMud Tracker`,
      subject: 'Welcome to LeonMud Performance Tracker',
      body,
    });

    if (record) {
      await base44.asServiceRole.entities.User.update(record.id, { welcome_email_sent: true });
    }

    return Response.json({ sent: true, to: user.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}