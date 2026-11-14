import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Sends the admin's welcome email the first time a teacher opens the app.
 * The backend function itself guards against duplicate sends, so this only
 * fires once per browser session.
 */
export default function WelcomeEmailTrigger() {
  useEffect(() => {
    const key = 'lm_welcome_email_checked';
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    base44.functions.invoke('sendWelcomeEmail', {}).catch(() => {});
  }, []);

  return null;
}