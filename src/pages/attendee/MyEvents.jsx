import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarX, QrCode, X } from 'lucide-react';
import AttendeeShell from '../../components/layout/AttendeeShell';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { meApi } from '../../lib/api';
import { formatDate, formatTime, isEventPast } from '../../lib/utils';
import { useToast } from '../../lib/ToastContext';
import { useLanguage } from '../../lib/LanguageContext';
import { useSEO } from '../../lib/useSEO';

export default function MyEvents() {
  const { push } = useToast();
  const { t } = useLanguage();
  useSEO('My Events', undefined, { noindex: true });
  const [tab, setTab] = useState('upcoming');
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    meApi.myEvents()
      .then(({ registrations }) => setRegs(registrations.filter((r) => r.event)))
      .finally(() => setLoading(false));
  }

  async function handleCancel(id) {
    setCancellingId(id);
    try {
      await meApi.cancelRegistration(id);
      setRegs((rs) => rs.filter((r) => r.id !== id));
      push('Registration cancelled.', 'info');
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setCancellingId(null);
    }
  }

  const list = regs
    .filter((r) => (tab === 'upcoming' ? !isEventPast(r.event) : isEventPast(r.event)))
    .sort((a, b) => tab === 'upcoming' ? String(a.event.date).localeCompare(String(b.event.date)) : String(b.event.date).localeCompare(String(a.event.date)));

  const TABS = [
    { key: 'upcoming', label: t('events_upcoming') },
    { key: 'past', label: t('events_past') },
  ];

  return (
    <AttendeeShell title={t('myevents_title')} subtitle={t('myevents_subtitle')}>
      <div className="flex gap-2 mb-6">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className="text-sm font-medium px-3.5 py-1.5 rounded-full border transition-colors"
            style={tab === tabItem.key ? { background: '#22D3A6', color: '#04140f', borderColor: '#22D3A6' } : { color: 'var(--text-dim)', borderColor: 'var(--line-12)' }}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-2xl skeleton" />)}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={CalendarX} title={tab === 'upcoming' ? t('dash_empty_title') : t('events_past')} description={tab === 'upcoming' ? t('myevents_empty_upcoming') : t('myevents_empty_past')} />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((r) => (
            <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
              <div className="min-w-0">
                <p className="font-medium text-[var(--text)]">{r.event.title}</p>
                <p className="text-sm text-[var(--text-dim)]">{formatDate(r.event.date)} &middot; {formatTime(r.event.startTime, r.event.timezone, r.event.date)} &middot; {r.event.venue}</p>
                <p className="text-xs text-[var(--text-dim)] font-mono mt-1">{r.registrationReference}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge status={r.status === 'waitlisted' ? 'waitlisted' : (r.attendance ? 'checked-in' : 'confirmed')} />
                {r.status === 'waitlisted' ? (
                  <span className="text-xs text-[var(--text-dim)]">Confirms automatically if a spot opens</span>
                ) : (
                  <Link to={`/qr-pass/${r.id}`} className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg" style={{ background: 'rgba(34,211,166,0.12)', color: '#22D3A6' }}>
                    <QrCode size={14} /> {t('myevents_pass')}
                  </Link>
                )}
                {tab === 'upcoming' && !r.attendance && (
                  <button
                    onClick={() => handleCancel(r.id)}
                    disabled={cancellingId === r.id}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-2 rounded-lg text-[#FF5C77] hover:bg-white/5 disabled:opacity-60"
                  >
                    <X size={13} /> {cancellingId === r.id ? t('myevents_cancelling') : (r.status === 'waitlisted' ? 'Leave waitlist' : t('myevents_cancel'))}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AttendeeShell>
  );
}
