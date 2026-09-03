import Notification from '../models/Notification.js';
import { config } from '../config/env.js';

// Fire-and-forget email via Resend's HTTP API. Never throws — a failed or
// unconfigured email should never break the signup flow that triggered it,
// since the in-app notification (see notifyNewUser below) already covers
// the "tell the admin" requirement on its own.
async function sendAdminEmail(subject, text) {
  if (!config.resendApiKey) return; // email is optional; silently skip if not set up
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.notificationEmailFrom,
        to: config.adminEmail,
        subject,
        text,
      }),
    });
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error('[notifications] Resend email failed:', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[notifications] Resend email failed:', err.message);
  }
}

// Called right after a brand-new account is created (normal signup or a
// first-time Google sign-in) — never for accounts an admin creates
// themselves from the Users page, since that's not "someone joining", it's
// the admin's own action.
export async function notifyNewUser(user) {
  const message = `${user.name} (${user.email}) just created an account.`;
  await Notification.create({
    type: 'user_registered',
    message,
    meta: { userId: user.id || user._id, userEmail: user.email },
  });
  // Deliberately not awaited by callers — see sendAdminEmail's own
  // try/catch, this is safe to let run in the background.
  sendAdminEmail('New Presence signup', `${message}\n\nView them in the admin dashboard under Users.`);
}
