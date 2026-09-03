import { useEffect, useMemo, useState } from 'react';
import { Search, Download, FileBarChart } from 'lucide-react';
import AdminShell from '../../components/layout/AdminShell';
import { useSEO } from '../../lib/useSEO';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { adminApi, eventsApi } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { useToast } from '../../lib/ToastContext';

export default function AdminReports() {
  useSEO('Reports', undefined, { noindex: true });
  const { push } = useToast();
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    Promise.all([eventsApi.listAdmin(), adminApi.registrations()])
      .then(([e, r]) => { setEvents(e.events); setRegistrations(r.registrations); })
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    return registrations
      .filter((r) => eventId === 'all' || r.eventId === eventId)
      .filter((r) => !q || r.user?.name.toLowerCase().includes(q.toLowerCase()) || r.user?.email.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [registrations, eventId, q]);

  function exportCsv() {
    const header = ['Attendee', 'Email', 'Event', 'Reference', 'RSVP status', 'Check-in status', 'Check-in time'];
    const body = rows.map((r) => [
      r.user?.name, r.user?.email, r.event?.title, r.registrationReference, r.status,
      r.attendance ? 'Checked in' : 'Not checked in', r.attendance ? formatDateTime(r.attendance.checkedInAt) : '',
    ]);
    const csv = [header, ...body].map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'presence-attendance-report.csv';
    a.click(); URL.revokeObjectURL(url);
    push('Report exported as CSV.', 'success');
  }

  return (
    <AdminShell
      title="Reports"
      subtitle="Attendance across every event."
      actions={<button onClick={exportCsv} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: '#22D3A6', color: '#04140f' }}><Download size={14} /> Export CSV</button>}
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search attendee name or email…" className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm text-[var(--text)] outline-none" style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }} />
        </div>
        <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="rounded-xl border px-4 py-2.5 text-sm text-[var(--text)] outline-none" style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }}>
          <option value="all">All events</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid gap-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 rounded-xl skeleton" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={FileBarChart} title="No attendance records yet" description="Records will appear here once attendees start registering." />
      ) : (
        <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--text-dim)]" style={{ background: 'var(--line-03)' }}>
                <th className="px-5 py-3 font-semibold">Attendee</th>
                <th className="px-5 py-3 font-semibold">Event</th>
                <th className="px-5 py-3 font-semibold">Reference</th>
                <th className="px-5 py-3 font-semibold">RSVP</th>
                <th className="px-5 py-3 font-semibold">Check-in</th>
                <th className="px-5 py-3 font-semibold">Check-in time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t" style={{ borderColor: 'var(--line-06)' }}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-[var(--text)]">{r.user?.name}</p>
                    <p className="text-xs text-[var(--text-dim)]">{r.user?.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--text-dim)] max-w-[200px] truncate">{r.event?.title}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-[var(--text-dim)]">{r.registrationReference}</td>
                  <td className="px-5 py-3.5"><Badge status={r.status} /></td>
                  <td className="px-5 py-3.5"><Badge status={r.attendance ? 'checked-in' : 'pending'} /></td>
                  <td className="px-5 py-3.5 text-[var(--text-dim)]">{r.attendance ? formatDateTime(r.attendance.checkedInAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
