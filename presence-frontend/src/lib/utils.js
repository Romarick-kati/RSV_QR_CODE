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
export function toDateInputValue(iso) {
  return String(iso).slice(0, 10);
}
export function classNames(...xs) {
  return xs.filter(Boolean).join(' ');
}
