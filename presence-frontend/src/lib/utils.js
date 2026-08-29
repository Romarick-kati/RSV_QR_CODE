// Accepts either a plain "YYYY-MM-DD" string (old mock-data shape) or a full
// ISO datetime string as returned by the Prisma/Postgres backend, and always
// returns a Date anchored at UTC midnight for that calendar day so event
// dates don't shift by a day depending on the viewer's timezone.
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
export function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}
export function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
export function isEventPast(event) {
  return toDateOnly(event.date) < new Date(new Date().toDateString());
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
