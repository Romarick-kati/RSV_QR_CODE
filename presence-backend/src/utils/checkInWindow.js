// A QR pass is only meaningful during the event, roughly. Allowing check-in
// at any time forever means a screenshotted or shared code stays a valid
// "ticket" indefinitely — this narrows that window to something reasonable,
// without needing any extra hardware or manual configuration per event.

const EARLY_WINDOW_MS = 2 * 60 * 60 * 1000; // opens 2h before start
const LATE_WINDOW_MS = 3 * 60 * 60 * 1000; // closes 3h after scheduled end

function combineDateAndTime(date, hhmm) {
  const [h, m] = (hhmm || '00:00').split(':').map(Number);
  const d = new Date(date);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

/** @returns {{ start: Date, end: Date }} */
export function getCheckInWindow(event) {
  const start = new Date(combineDateAndTime(event.date, event.startTime).getTime() - EARLY_WINDOW_MS);
  // Note: assumes the event doesn't run past midnight (endTime > startTime
  // on the same calendar day) — true for the vast majority of events this
  // app targets. A multi-day or overnight event would need a real end date.
  const end = new Date(combineDateAndTime(event.date, event.endTime).getTime() + LATE_WINDOW_MS);
  return { start, end };
}

export function isWithinCheckInWindow(event, now = new Date()) {
  const { start, end } = getCheckInWindow(event);
  return now >= start && now <= end;
}
