// A QR pass is only meaningful during the event, roughly. Allowing check-in
// at any time forever means a screenshotted or shared code stays a valid
// "ticket" indefinitely — this narrows that window to something reasonable,
// without needing any extra hardware or manual configuration per event.

import { getTimezoneOffsetMinutes } from './timezone.js';

const EARLY_WINDOW_MS = 2 * 60 * 60 * 1000; // opens 2h before start
const LATE_WINDOW_MS = 3 * 60 * 60 * 1000; // closes 3h after scheduled end

// Event organizers pick a date and type "08:00" meaning 8am in the event's
// own timezone (event.timezone, e.g. "Africa/Douala") — the
// <input type="time"> field has no timezone concept at all, it's just a
// wall-clock string. The server that runs this comparison, though, is a
// Netlify Function running in UTC. Naively calling `.setHours()` applies
// the *server's* local timezone (UTC) to the organizer's intended-as-local
// hour — silently treating "08:00 Douala" as "08:00 UTC" (i.e. 9am WAT), a
// full hour off. This resolves the event's actual offset (DST-aware, via
// Intl) for the event's own calendar date instead of assuming one fixed
// offset for every event regardless of where it's hosted.
function combineDateAndTime(date, hhmm, timezone) {
  const [h, m] = (hhmm || '00:00').split(':').map(Number);
  const d = new Date(date);
  // event.date is stored as UTC midnight of the intended calendar date
  // (that's how `new Date("2026-08-30")` from the <input type="date">
  // value parses), so reading the Y/M/D back with the UTC getters gives
  // the correct calendar date regardless of server timezone.
  const y = d.getUTCFullYear();
  const mo = d.getUTCMonth();
  const day = d.getUTCDate();
  const offsetMinutes = getTimezoneOffsetMinutes(timezone || 'Africa/Douala', d);
  // Build the instant as "Y-M-D H:M in the event's local timezone",
  // by constructing it in UTC and then subtracting the resolved offset —
  // rather than trusting the server's own local timezone or one hardcoded
  // global offset.
  return new Date(Date.UTC(y, mo, day, h || 0, m || 0, 0, 0) - offsetMinutes * 60 * 1000);
}

// A deadline of "2026-08-31" is stored as 2026-08-31T00:00:00Z — the very
// first instant of that day, not the end of it. Compared directly against
// "now", a deadline set to "today" reads as already-passed for all but the
// first hour after local midnight. This returns the true end of that
// calendar day in the event's own local timezone (23:59:59.999 local),
// which is what an organizer actually means by "deadline: today".
export function endOfDayInEventTimezone(date, timezone) {
  return new Date(combineDateAndTime(date, '23:59', timezone).getTime() + 59 * 1000 + 999);
}

/** @returns {{ start: Date, end: Date }} */
export function getCheckInWindow(event) {
  const start = new Date(combineDateAndTime(event.date, event.startTime, event.timezone).getTime() - EARLY_WINDOW_MS);
  // Note: assumes the event doesn't run past midnight (endTime > startTime
  // on the same calendar day) — true for the vast majority of events this
  // app targets. A multi-day or overnight event would need a real end date.
  const end = new Date(combineDateAndTime(event.date, event.endTime, event.timezone).getTime() + LATE_WINDOW_MS);
  return { start, end };
}

export function isWithinCheckInWindow(event, now = new Date()) {
  const { start, end } = getCheckInWindow(event);
  return now >= start && now <= end;
}
