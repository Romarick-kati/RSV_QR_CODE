import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, QrCode, History, ArrowRight } from 'lucide-react';
import AttendeeShell from '../../components/layout/AttendeeShell';
import EmptyState from '../../components/ui/EmptyState';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import { meApi } from '../../lib/api';
import { formatDate, isEventPast, daysUntil } from '../../lib/utils';
import { useSEO } from '../../lib/useSEO';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  useSEO('Dashboard', undefined, { noindex: true });

  useEffect(() => {
    let cancelled = false;
    meApi.myEvents()
      .then(({ registrations }) => { if (!cancelled) setRegs(registrations); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const upcoming = regs.filter((r) => r.event && !isEventPast(r.event) && r.status !== 'waitlisted').sort((a, b) => String(a.event.date).localeCompare(String(b.event.date)));
  const waitlisted = regs.filter((r) => r.event && !isEventPast(r.event) && r.status === 'waitlisted');
  const checkedIn = regs.filter((r) => r.attendance);
  const nextUp = upcoming[0];
  // "Total registrations" should mean confirmed seats, not pending
  // waitlist entries that might never turn into one — counting both would
  // overstate this number and confuse the attendee.
  const confirmedRegsCount = regs.filter((r) => r.status !== 'waitlisted').length;

  if (!user) return null; // ProtectedRoute guarantees this resolves before render; guards a null flash regardless.

  return (
    <AttendeeShell title={t('dash_welcome', { name: user.name.split(' ')[0] })} subtitle={t('dash_subtitle')}>
      {!loading && nextUp && (
        <Link
          to={`/qr-pass/${nextUp.id}`}
          className="flex items-center justify-between gap-4 rounded-2xl border p-5 mb-6 transition-colors hover:border-[#22D3A6]"
          style={{ borderColor: 'rgba(34,211,166,0.35)', background: 'linear-gradient(120deg, rgba(34,211,166,0.10), rgba(139,124,246,0.08))' }}
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#22D3A6' }}>{t('dash_next_up')}</p>
            <p className="font-display font-semibold text-[var(--text)] truncate">{nextUp.event.title}</p>
            <p className="text-sm text-[var(--text-dim)] mt-0.5">
              {daysUntil(nextUp.event) === 0 ? t('dash_days_today') : daysUntil(nextUp.event) === 1 ? t('dash_days_tomorrow') : t('dash_days_in', { days: daysUntil(nextUp.event) })}
              {' '}&middot; {formatDate(nextUp.event.date)} &middot; {nextUp.event.venue}
            </p>
          </div>
          <span className="shrink-0 flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: '#22D3A6', color: '#04140f' }}>
            {t('dash_view_pass')} <ArrowRight size={14} />
          </span>
        </Link>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-2xl skeleton" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatCard label={t('dash_upcoming_events')} value={upcoming.length} icon={CalendarCheck} accent="#22D3A6" />
          <StatCard label={t('dash_total_registrations')} value={confirmedRegsCount} icon={QrCode} accent="#8B7CF6" />
          <StatCard label={t('dash_events_attended')} value={checkedIn.length} icon={History} accent="#F5A623" />
        </div>
      )}

      {!loading && waitlisted.length > 0 && (
        <Link
          to="/my-events"
          className="hover-lift flex items-center justify-between gap-4 rounded-2xl border p-4 mb-6"
          style={{ borderColor: 'rgba(139,124,246,0.35)', background: 'rgba(139,124,246,0.08)' }}
        >
          <p className="text-sm font-medium">
            <span className="font-semibold" style={{ color: '#8B7CF6' }}>{waitlisted.length}</span>{' '}
            {waitlisted.length === 1 ? 'event' : 'events'} you're waitlisted for — we'll confirm automatically if a spot opens.
          </p>
          <ArrowRight size={16} className="shrink-0" style={{ color: '#8B7CF6' }} />
        </Link>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold">{t('dash_upcoming_registrations')}</h2>
        <Link to="/my-events" className="text-sm font-semibold flex items-center gap-1" style={{ color: '#22D3A6' }}>{t('action_view_all')} <ArrowRight size={14} /></Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 rounded-2xl skeleton" />)}
        </div>
      ) : upcoming.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={t('dash_empty_title')}
          description={t('dash_empty_desc')}
          action={<Link to="/events" className="text-sm font-semibold px-4 py-2 rounded-lg inline-block" style={{ background: '#22D3A6', color: '#04140f' }}>{t('dash_browse_events')}</Link>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {upcoming.map((r) => (
            <Link key={r.id} to={`/qr-pass/${r.id}`} className="flex items-center justify-between gap-4 rounded-2xl border p-4 hover:border-[#22D3A6] transition-colors" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
              <div className="min-w-0">
                <p className="font-medium text-[var(--text)] truncate">{r.event.title}</p>
                <p className="text-sm text-[var(--text-dim)]">{formatDate(r.event.date)} &middot; {r.event.venue}</p>
              </div>
              <Badge status={r.attendance ? 'checked-in' : 'confirmed'} />
            </Link>
          ))}
        </div>
      )}
    </AttendeeShell>
  );
}
