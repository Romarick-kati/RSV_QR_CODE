import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Download, UserX, CheckCircle2, ArrowLeft, Wallet, ArrowUpCircle } from 'lucide-react';
import AdminShell from '../../components/layout/AdminShell';
import { useSEO } from '../../lib/useSEO';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { eventsApi, attendanceApi, meApi } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { useToast } from '../../lib/ToastContext';
import { downloadCsv } from '../../lib/csvExport';

export default function AdminEventAttendees() {
  useSEO('Attendees', undefined, { noindex: true });
  const { id } = useParams();
  const { push } = useToast();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const isPaid = (event?.price || 0) > 0;

  useEffect(() => {
    load();
    // Keep this list live while it's open — a staff member's scan at the
    // door shows up here within a few seconds, no manual refresh needed.
    const interval = setInterval(() => load({ silent: true }), 4000);
    return () => clearInterval(interval);
  }, [id]);
  function load({ silent } = {}) {
    if (!silent) setLoading(true);
    Promise.all([eventsApi.get(id), eventsApi.attendees(id)])
      .then(([e, a]) => { setEvent(e.event); setAttendees(a.attendees); })
      .finally(() => { if (!silent) setLoading(false); });
  }

  const filtered = useMemo(() => attendees.filter((a) => {
    const matchesQ = !q || a.user?.name.toLowerCase().includes(q.toLowerCase()) || a.user?.email.toLowerCase().includes(q.toLowerCase()) || a.registrationReference.toLowerCase().includes(q.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'checked-in' ? a.attendance : filter === 'waitlisted' ? a.status === 'waitlisted' : (!a.attendance && a.status !== 'waitlisted'));
    return matchesQ && matchesFilter;
  }), [attendees, q, filter]);
  const waitlistedCount = attendees.filter((a) => a.status === 'waitlisted').length;

  async function markAttendance(regId) {
    setBusyId(regId);
    try {
      await attendanceApi.manualCheckIn(regId);
      push('Marked as checked in.', 'success');
      load();
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }
  async function confirmPayment(regId) {
    setBusyId(regId);
    try {
      await attendanceApi.confirmPayment(regId);
      push('Payment confirmed — pass will now scan.', 'success');
      load();
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }
  async function promote(regId) {
    setBusyId(regId);
    try {
      await attendanceApi.promoteFromWaitlist(regId);
      push('Promoted off the waitlist — they now have a confirmed pass.', 'success');
      load();
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }
  async function removeRegistration(regId) {
    setBusyId(regId);
    try {
      await meApi.cancelRegistration(regId);
      push('Registration cancelled.', 'info');
      load();
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }
  function exportCsv() {
    const headers = ['Attendee', 'Email', 'Reference', 'Status', 'Checked in'];
    if (isPaid) headers.push('Payment', 'Payment reference');
    const rows = filtered.map((a) => {
      const row = [a.user?.name, a.user?.email, a.registrationReference, a.status, a.attendance ? formatDateTime(a.attendance.checkedInAt) : 'Not checked in'];
      if (isPaid) row.push(a.paymentStatus, a.paymentReference);
      return row;
    });
    downloadCsv(`${(event?.title || 'attendees').replace(/\s+/g, '-').toLowerCase()}-attendees.csv`, headers, rows);
    push('Attendee list exported.', 'success');
  }

  return (
    <AdminShell
      title="Attendees"
      subtitle={event?.title}
      actions={
        <>
          <Link to={`/admin/events/${id}`} className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-dim)] hover:text-[var(--text)]"><ArrowLeft size={15} /> Event</Link>
          <button onClick={exportCsv} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: '#22D3A6', color: '#04140f' }}><Download size={14} /> Export CSV</button>
        </>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email, or reference…" className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm text-[var(--text)] outline-none" style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }} />
        </div>
        <div className="flex gap-2">
          {[['all', 'All'], ['checked-in', 'Checked in'], ['pending', 'Not checked in'], ['waitlisted', `Waitlist${waitlistedCount ? ` (${waitlistedCount})` : ''}`]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className="text-[13px] font-medium px-3.5 py-1.5 rounded-full border" style={filter === v ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'var(--accent)' } : { color: 'var(--text-dim)', borderColor: 'var(--line-12)' }}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-xl skeleton" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={UserX} title="No attendees found" description="No registrations match your search or filter." />
      ) : (
        <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--text-dim)]" style={{ background: 'var(--line-03)' }}>
                <th className="px-5 py-3 font-semibold">Attendee</th>
                <th className="px-5 py-3 font-semibold">Reference</th>
                <th className="px-5 py-3 font-semibold">Registered</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                {isPaid && <th className="px-5 py-3 font-semibold">Payment</th>}
                <th className="px-5 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t" style={{ borderColor: 'var(--line-06)' }}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-[var(--text)]">{a.user?.name}</p>
                    <p className="text-xs text-[var(--text-dim)]">{a.user?.email}</p>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-[var(--text-dim)]">{a.registrationReference}</td>
                  <td className="px-5 py-3.5 text-[var(--text-dim)]">{formatDateTime(a.createdAt)}</td>
                  <td className="px-5 py-3.5"><Badge status={a.status === 'waitlisted' ? 'waitlisted' : (a.attendance ? 'checked-in' : 'pending')} /></td>
                  {isPaid && (
                    <td className="px-5 py-3.5">
                      {a.paymentStatus === 'confirmed' ? (
                        <span className="text-xs font-semibold" style={{ color: '#22D3A6' }}>Confirmed</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[var(--text-dim)]" title="Transaction reference the attendee submitted">{a.paymentReference || '—'}</span>
                          <button disabled={busyId === a.id} onClick={() => confirmPayment(a.id)} className="text-[#F5A623] font-semibold text-xs inline-flex items-center gap-1 disabled:opacity-50">
                            <Wallet size={12} /> Confirm
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    {a.status === 'waitlisted' ? (
                      <button disabled={busyId === a.id} onClick={() => promote(a.id)} className="font-semibold text-xs mr-3 inline-flex items-center gap-1 disabled:opacity-50" style={{ color: 'var(--accent)' }}>
                        <ArrowUpCircle size={13} /> Promote
                      </button>
                    ) : !a.attendance && (
                      <button disabled={busyId === a.id} onClick={() => markAttendance(a.id)} className="text-[#22D3A6] font-semibold text-xs mr-3 inline-flex items-center gap-1 disabled:opacity-50"><CheckCircle2 size={13} /> Mark present</button>
                    )}
                    <button disabled={busyId === a.id} onClick={() => removeRegistration(a.id)} className="text-[#FF5C77] font-semibold text-xs disabled:opacity-50">{a.status === 'waitlisted' ? 'Remove from waitlist' : 'Remove'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
