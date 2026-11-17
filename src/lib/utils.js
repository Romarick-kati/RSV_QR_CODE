// Accepts either a plain "YYYY-MM-DD" string (old mock-data shape) or a full
// ISO datetime string as returned by the Prisma/Postgres backend, and always
// returns a Date anchored at UTC midnight for that calendar day so event
// dates don't shift by a day depending on the viewer's timezone.
import { timezoneAbbreviation } from './timezones';

function toDateOnly(value) {
  const s = String(value);
  const day = s.length > 10 ? s.slice(0, 10) : s;
  return new Date(day + 'T00:00:00');
}

export function formatDate(iso, opts = {}) {
  return toDateOnly(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', ...opts });
}
export function formatDateLong(iso) {
  return toDateOnly(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
// `t` is the event's own wall-clock "HH:MM" string (what the organizer
// typed — always meant in the event's own timezone, never the viewer's).
// Pass the event's `timezone`/`date` to also append a short abbreviation
// (e.g. "6:00 PM WAT") so a visitor browsing from a different timezone
// still understands which clock the time is on, instead of silently
// assuming it's their own local time.
export function formatTime(t, timezone, date) {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const base = `${h12}:${String(m).padStart(2, '0')} ${period}`;
  if (!timezone) return base;
  const abbr = timezoneAbbreviation(timezone, date ? toDateOnly(date) : new Date());
  return `${base} ${abbr}`;
}
export function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
export function isEventPast(event) {
  return toDateOnly(event.date) < new Date(new Date().toDateString());
}
// A registration deadline of "today" should mean "open until the end of
// today in the event's own timezone", not "open until midnight UTC" — see
// the matching backend fix in netlify/functions/server/utils/checkInWindow.js
// (endOfDayInEventTimezone). Comparing the raw deadline string against
// `new Date()` directly, like the old code did, would show "Registration
// closed" in the UI for most of a same-day deadline even though the
// (already-fixed) backend would actually accept the request — so this has
// to mirror that fix exactly, or the button just lies about being closed.
// Each event can now be hosted in a different city/timezone (event.timezone,
// an IANA zone name) rather than the app assuming every event is WAT.
function getTimezoneOffsetMinutes(timeZone, date) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(date).reduce((acc, p) => { if (p.type !== 'literal') acc[p.type] = p.value; return acc; }, {});
    const asUTC = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
    return Math.round((asUTC - date.getTime()) / 60000);
  } catch {
    return 60; // fall back to WAT for an unrecognized zone string
  }
}
export function isRegistrationDeadlinePassed(event) {
  if (!event?.registrationDeadline) return false;
  // Parse the date-only string as UTC directly (same as the backend's
  // `new Date("2026-08-31")` behavior), rather than reusing toDateOnly()
  // above — that helper appends a bare "T00:00:00" with no "Z", which
  // JavaScript parses as the *visitor's local* midnight, not UTC. For a
  // visitor east of UTC (e.g. Asia), that shifts the calendar day back by
  // one before we even get to the timezone-offset math below.
  const dateOnly = String(event.registrationDeadline).slice(0, 10);
  const d = new Date(dateOnly);
  const offsetMinutes = getTimezoneOffsetMinutes(event.timezone || 'Africa/Douala', d);
  const endOfDayUtc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999) - offsetMinutes * 60000);
  return endOfDayUtc < new Date();
}
export function daysUntil(event) {
  const target = toDateOnly(event.date);
  const today = new Date(new Date().toDateString());
  return Math.round((target - today) / 86400000);
}
// Builds a standard .ics file client-side and triggers a download, so an
// attendee's pass can go straight into their phone or desktop calendar app
// with one tap — no server round-trip needed since everything required
// (date, time, venue, title) is already on the registration object.
export function downloadIcsForEvent(event) {
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = String(event.date).slice(0, 10).replace(/-/g, '');
  const [sh, sm] = event.startTime.split(':').map(Number);
  const [eh, em] = event.endTime.split(':').map(Number);
  const escape = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Presence//Event Registration//EN',
    'BEGIN:VEVENT',
    `UID:${event.id || event._id || dateStr}@presence.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dateStr}T${pad(sh)}${pad(sm)}00`,
    `DTEND:${dateStr}T${pad(eh)}${pad(em)}00`,
    `SUMMARY:${escape(event.title)}`,
    `LOCATION:${escape(event.venue)}`,
    `DESCRIPTION:${escape(event.description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${String(event.title).replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60)}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
export function toDateInputValue(iso) {
  return String(iso).slice(0, 10);
}
export function classNames(...xs) {
  return xs.filter(Boolean).join(' ');
}
