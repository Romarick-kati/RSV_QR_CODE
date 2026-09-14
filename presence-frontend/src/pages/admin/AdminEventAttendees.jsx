import { useEffect, useMemo, useState, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Download, UserX, CheckCircle2, ArrowLeft, Wallet, ArrowUpCircle, ChevronDown, ChevronRight, MessageSquareText } from 'lucide-react';
import AdminShell from '../../components/layout/AdminShell';
import { useSEO } from '../../lib/useSEO';
import { useVisibilityPolling } from '../../lib/useVisibilityPolling';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { eventsApi, attendanceApi, meApi } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { useToast } from '../../lib/ToastContext';
import { downloadCsv } from '../../lib/csvExport';
import { useLanguage } from '../../lib/LanguageContext';

export default function AdminEventAttendees() {
  const { t } = useLanguage();
  useSEO(t('adm_detail_tab_attendees'), undefined, { noindex: true });
  const { id } = useParams();
  const { push } = useToast();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const isPaid = (event?.price || 0) > 0;

  useEffect(() => {
    load();
  }, [id]);
  // Keep this list live while it's open — a staff member's scan at the
  // door shows up here within a few seconds, no manual refresh needed.
  // 8s (was 4s) and paused while the tab isn't visible — halves the
  // request volume for a screen that's often left open in the background.
  useVisibilityPolling(() => load({ silent: true }), 8000);
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
      push(t('adm_att_toast_marked_checked_in'), 'success');
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
      push(t('adm_att_toast_payment_confirmed'), 'success');
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
      push(t('adm_att_toast_promoted'), 'success');
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
      push(t('adm_att_toast_cancelled'), 'info');
      load();
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }
  function exportCsv() {
    const questionLabels = (event?.registrationQuestions || []).map((q) => q.label);
    const headers = ['Attendee', 'Email', 'Reference', 'Status', 'Checked in'];
    if (isPaid) headers.push('Payment status', 'Fapshi transaction ID');
    headers.push(...questionLabels);
    const rows = filtered.map((a) => {
      const row = [a.user?.name, a.user?.email, a.registrationReference, a.status, a.attendance ? formatDateTime(a.attendance.checkedInAt) : 'Not checked in'];
      if (isPaid) row.push(a.paymentStatus, a.paymentGatewayReference || '');
      for (const label of questionLabels) {
        row.push(a.answers?.find((ans) => ans.label === label)?.answer || '');
      }
      return row;
    });
    downloadCsv(`${(event?.title || 'attendees').replace(/\s+/g, '-').toLowerCase()}-attendees.csv`, headers, rows);
    push(t('adm_att_toast_exported'), 'success');
  }

  return (
    <AdminShell
      title={t('adm_detail_tab_attendees')}
      subtitle={event?.title}
      actions={
        <>
          <Link to={`/admin/events/${id}`} className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-dim)] hover:text-[var(--text)]"><ArrowLeft size={15} /> {t('adm_att_back_to_event')}</Link>
          <button onClick={exportCsv} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: '#22D3A6', color: '#04140f' }}><Download size={14} /> {t('adm_att_export_csv')}</button>
        </>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('adm_att_search_placeholder')} className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm text-[var(--text)] outline-none" style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }} />
        </div>
        <div className="flex gap-2">
          {[['all', t('adm_att_filter_all')], ['checked-in', t('adm_dash_th_checked_in')], ['pending', t('adm_att_filter_not_checked_in')], ['waitlisted', `${t('adm_att_filter_waitlist')}${waitlistedCount ? ` (${waitlistedCount})` : ''}`]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className="text-[13px] font-medium px-3.5 py-1.5 rounded-full border" style={filter === v ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'var(--accent)' } : { color: 'var(--text-dim)', borderColor: 'var(--line-12)' }}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-xl skeleton" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={UserX} title={t('adm_att_empty_title')} description={t('adm_att_empty_desc')} />
      ) : (
        <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--text-dim)]" style={{ background: 'var(--line-03)' }}>
                <th className="px-5 py-3 font-semibold">{t('adm_att_th_attendee')}</th>
                <th className="px-5 py-3 font-semibold">{t('adm_att_th_reference')}</th>
                <th className="px-5 py-3 font-semibold">{t('adm_dash_th_registered')}</th>
                <th className="px-5 py-3 font-semibold">{t('adm_dash_th_status')}</th>
                {isPaid && <th className="px-5 py-3 font-semibold">{t('adm_att_th_payment')}</th>}
                <th className="px-5 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const hasAnswers = a.answers && a.answers.length > 0;
                const isExpanded = expandedId === a.id;
                return (
                <Fragment key={a.id}>
                <tr className="border-t" style={{ borderColor: 'var(--line-06)' }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {hasAnswers && (
                        <button onClick={() => setExpandedId(isExpanded ? null : a.id)} className="text-[var(--text-dim)] hover:text-[var(--text)] shrink-0">
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      )}
                      <div>
                        <p className="font-medium text-[var(--text)]">{a.user?.name}</p>
                        <p className="text-xs text-[var(--text-dim)]">{a.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-[var(--text-dim)]">{a.registrationReference}</td>
                  <td className="px-5 py-3.5 text-[var(--text-dim)]">{formatDateTime(a.createdAt)}</td>
                  <td className="px-5 py-3.5"><Badge status={a.status === 'waitlisted' ? 'waitlisted' : (a.attendance ? 'checked-in' : 'pending')} /></td>
                  {isPaid && (
                    <td className="px-5 py-3.5">
                      {a.paymentStatus === 'confirmed' ? (
                        <span className="text-xs font-semibold" style={{ color: '#22D3A6' }}>{t('adm_att_payment_confirmed')}</span>
                      ) : a.paymentStatus === 'failed' ? (
                        <span className="text-xs font-semibold" style={{ color: '#FF5C77' }}>{t('adm_att_payment_failed')}</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[var(--text-dim)]" title={t('adm_att_fapshi_tx_title')}>{a.paymentGatewayReference || '—'}</span>
                          <button disabled={busyId === a.id} onClick={() => confirmPayment(a.id)} title={t('adm_att_force_confirm_title')} className="text-[#F5A623] font-semibold text-xs inline-flex items-center gap-1 disabled:opacity-50">
                            <Wallet size={12} /> {t('adm_att_force_confirm')}
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    {a.status === 'waitlisted' ? (
                      <button disabled={busyId === a.id} onClick={() => promote(a.id)} className="font-semibold text-xs mr-3 inline-flex items-center gap-1 disabled:opacity-50" style={{ color: 'var(--accent)' }}>
                        <ArrowUpCircle size={13} /> {t('adm_att_promote')}
                      </button>
                    ) : !a.attendance && (
                      <button disabled={busyId === a.id} onClick={() => markAttendance(a.id)} className="text-[#22D3A6] font-semibold text-xs mr-3 inline-flex items-center gap-1 disabled:opacity-50"><CheckCircle2 size={13} /> {t('adm_att_mark_present')}</button>
                    )}
                    <button disabled={busyId === a.id} onClick={() => removeRegistration(a.id)} className="text-[#FF5C77] font-semibold text-xs disabled:opacity-50">{a.status === 'waitlisted' ? t('adm_att_remove_from_waitlist') : t('adm_att_remove')}</button>
                  </td>
                </tr>
                {isExpanded && hasAnswers && (
                  <tr style={{ background: 'var(--line-03)' }}>
                    <td colSpan={isPaid ? 6 : 5} className="px-5 py-3">
                      <div className="flex items-start gap-2 text-xs">
                        <MessageSquareText size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
                        <div className="flex flex-col gap-1.5">
                          {a.answers.map((ans) => (
                            <p key={ans.label}>
                              <span className="text-[var(--text-dim)]">{ans.label}: </span>
                              <span className="text-[var(--text)] font-medium">{ans.answer || '—'}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
