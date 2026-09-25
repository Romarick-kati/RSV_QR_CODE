import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { config } from '../config/env.js';

// Fire-and-forget email via Resend's HTTP API. Never throws — a failed or
// unconfigured email should never break whatever flow triggered it, since
// the in-app notification always fires first and covers the "tell someone"
// requirement on its own regardless of whether email is even configured.
// `to` may be a single address or an array (used as `bcc` — see
// notifyEventPublished below, which sends one email to many attendees
// without exposing anyone else's address in the "to" line).
async function sendEmail({ to, bcc, subject, text }) {
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
        // Resend requires a `to`, even for a pure-bcc broadcast — the
        // sender's own address is a reasonable, harmless placeholder that
        // reveals nothing about who's actually receiving the email.
        to: to || config.notificationEmailFrom,
        ...(bcc ? { bcc } : {}),
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
    audience: 'admin',
    message,
    meta: { userId: user.id || user._id, userEmail: user.email },
  });
  // Deliberately not awaited by callers — see sendEmail's own try/catch,
  // this is safe to let run in the background. `to` is explicit here
  // (config.adminEmail) — without it, sendEmail's own fallback sends the
  // email to itself (config.notificationEmailFrom), which is never an inbox
  // anyone actually checks, so this notification would silently vanish.
  sendEmail({ to: config.adminEmail, subject: 'New Presence signup', text: `${message}\n\nView them in the admin dashboard under Users.` });
}

// Called whenever an event's status transitions TO 'published' — whether
// that happens at creation (created directly as published) or later (an
// edit flips a draft live). This is Presence's answer to "how does anyone
// find out a new event exists": an in-app notice everyone with an account
// sees via the attendee-facing bell, plus (if email is configured) one
// broadcast email.
//
// Caveat worth being honest about: this bcc's every attendee on the
// platform for every single published event, with no per-user
// opt-out/preferences and no unsubscribe link. That's fine at small scale,
// but is exactly the kind of thing that gets a sending domain flagged by
// spam filters once the platform has a few hundred attendees and a few
// events a week. A real "digest" (daily/weekly roundup) or a
// preferences-driven opt-in is the right next step before this scales up —
// treat this as the v1 that proves the feature, not the final version.
//
// The cap below is deliberately tight, not generous — Resend's free tier
// (confirmed against their current docs) caps sending at 100 emails/DAY,
// and counts every single To/CC/BCC address as its own email against that
// cap — a 200-person bcc is 200 emails, not 1. That cap is shared with
// every other email this app sends (e.g. the admin new-signup notice), so
// broadcasting to more than roughly half the daily allowance in one shot
// risks either failing outright or silently starving other notifications
// for the rest of that day. If the platform has more attendees than this,
// upgrade the Resend plan or (better) build a real digest before raising
// this number — don't just raise the number.
const MAX_BROADCAST_RECIPIENTS = 40;
export async function notifyEventPublished(event) {
  // Wrapped in its own try/catch because callers deliberately don't await
  // this (see event.controller.js) — an unhandled rejection from here
  // would otherwise escape silently (or, depending on the Node version,
  // crash the process) instead of just logging and moving on.
  try {
    const message = `New event published: "${event.title}" on ${new Date(event.date).toLocaleDateString()}.`;
    await Notification.create({
      type: 'event_published',
      audience: 'attendee',
      message,
      meta: { eventId: event.id || event._id, title: event.title, category: event.category, format: event.format },
    });

    const attendees = await User.find({ role: 'ATTENDEE' }, 'email').limit(MAX_BROADCAST_RECIPIENTS);
    const emails = attendees.map((a) => a.email).filter(Boolean);
    if (emails.length === 0) return;
    const eventUrl = `${config.corsOrigin}/events/${event.id || event._id}`;
    sendEmail({
      bcc: emails,
      subject: `New on Presence: ${event.title}`,
      text: `A new event just went live on Presence:\n\n${event.title}\n${new Date(event.date).toLocaleDateString()} · ${event.venue}\n\nSee details and register: ${eventUrl}`,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[notifications] notifyEventPublished failed:', err.message);
  }
}
