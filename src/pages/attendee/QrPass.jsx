import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, Clock, MapPin, Download, ArrowLeft, CheckCircle2, TriangleAlert, CalendarPlus, ScanLine } from 'lucide-react';
import AttendeeShell from '../../components/layout/AttendeeShell';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import BrandMark from '../../components/ui/BrandMark';
import { useLanguage } from '../../lib/LanguageContext';
import { meApi } from '../../lib/api';
import { useSEO } from '../../lib/useSEO';
import { formatDateLong, formatTime, formatDateTime, downloadIcsForEvent } from '../../lib/utils';
import { buildCheckinUrl } from '../../lib/checkinUrl';

export default function QrPass() {
  const { id } = useParams();
  const { t } = useLanguage();
  useSEO('Your QR Pass', undefined, { noindex: true });
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    meApi.registration(id)
      .then(({ registration }) => { if (!cancelled) setRegistration(registration); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  function handlePrint() {
    window.print();
  }

  function handleAddToCalendar() {
    downloadIcsForEvent(registration.event);
  }

  return (
    <AttendeeShell
      title={t('pass_title')}
      subtitle={t('pass_subtitle')}
      actions={
        <Link to="/my-events" className="text-sm font-medium text-[var(--text-dim)] hover:text-[var(--text)] flex items-center gap-1.5">
          <ArrowLeft size={15} /> {t('pass_my_events')}
        </Link>
      }
    >
      {loading ? (
        <div className="max-w-md mx-auto h-[420px] rounded-[26px] skeleton" />
      ) : error || !registration || !registration.event || !registration.attendanceToken ? (
        <EmptyState icon={TriangleAlert} title={t('pass_not_found_title')} description={error || t('pass_not_found_desc')} />
      ) : registration.status === 'waitlisted' ? (
        <div className="max-w-md mx-auto rounded-[26px] border p-8 text-center" style={{ borderColor: 'rgba(139,124,246,0.35)', background: 'rgba(139,124,246,0.06)' }}>
          <span className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(139,124,246,0.16)' }}>
            <ScanLine size={22} style={{ color: '#8B7CF6' }} />
          </span>
          <h2 className="font-display text-lg font-bold mb-2">You're on the waitlist</h2>
          <p className="text-sm text-[var(--text-dim)] mb-1">{registration.event.title}</p>
          <p className="text-xs text-[var(--text-dim)] leading-relaxed mt-3">
            There's no pass to show yet — this event is full. If a spot opens up, you'll be confirmed automatically and a scannable pass will appear here.
          </p>
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          {/* This card is intentionally always dark, like a physical event
              badge — its text uses fixed --pass-text tokens rather than the
              themed --text tokens, so it stays legible in light mode too. */}
          <div id="pass-card" className="rounded-[26px] border shadow-2xl overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'linear-gradient(160deg,#151b34,#0d1122)' }}>
            <div className="p-7 pb-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrandMark size={28} />
                <span className="font-display font-bold text-sm" style={{ color: 'var(--pass-text)' }}>Presence</span>
              </div>
              <Badge status={registration.attendance ? 'checked-in' : 'confirmed'} />
            </div>

            <div className="px-7 pt-5">
              <h2 className="font-display text-xl font-semibold leading-snug mb-4" style={{ color: 'var(--pass-text)' }}>{registration.event.title}</h2>
              <div className="flex flex-col gap-2 text-sm mb-6" style={{ color: 'var(--pass-text-dim)' }}>
                <span className="flex items-center gap-2"><Calendar size={14} /> {formatDateLong(registration.event.date)}</span>
                <span className="flex items-center gap-2"><Clock size={14} /> {formatTime(registration.event.startTime, registration.event.timezone, registration.event.date)} – {formatTime(registration.event.endTime, registration.event.timezone, registration.event.date)}</span>
                <span className="flex items-center gap-2"><MapPin size={14} /> {registration.event.venue}</span>
              </div>
            </div>

            <div className="mx-7 mb-3 rounded-2xl p-6 flex flex-col items-center gap-4" style={{ background: '#fff' }}>
              <QRCodeSVG value={buildCheckinUrl(registration.attendanceToken)} size={188} bgColor="#ffffff" fgColor="#0A0D18" level="M" />
              <p className="font-mono text-xs tracking-wide text-[#0A0D18]/60">{registration.registrationReference}</p>
            </div>

            <div className="px-7 pb-7 pt-2 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--pass-text-dim)' }}>{t('pass_attendee')}</p>
                <p className="font-medium" style={{ color: 'var(--pass-text)' }}>{registration.user?.name}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--pass-text-dim)' }}>{t('pass_registered')}</p>
                <p className="font-medium" style={{ color: 'var(--pass-text)' }}>{formatDateTime(registration.createdAt)}</p>
              </div>
            </div>

            {registration.attendance && (
              <div className="mx-7 mb-7 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium" style={{ background: 'rgba(34,211,166,0.12)', color: '#22D3A6' }}>
                <CheckCircle2 size={16} /> {t('pass_checked_in', { time: formatDateTime(registration.attendance.checkedInAt) })}
              </div>
            )}
          </div>

          {!registration.attendance && (
            <div className="mt-5 rounded-2xl border p-5 flex items-start gap-3" style={{ borderColor: 'rgba(34,211,166,0.35)', background: 'rgba(34,211,166,0.08)' }}>
              <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(34,211,166,0.16)' }}>
                <ScanLine size={17} style={{ color: '#22D3A6' }} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--text)] mb-0.5">{t('pass_howto_title')}</p>
                <p className="text-xs text-[var(--text-dim)] leading-relaxed">{t('pass_howto_desc')}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              onClick={handleAddToCalendar}
              className="flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl border hover:bg-white/5 transition-colors text-[var(--text)]"
              style={{ borderColor: 'var(--line-14)' }}
            >
              <CalendarPlus size={15} /> {t('pass_add_to_calendar')}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl border hover:bg-white/5 transition-colors text-[var(--text)]"
              style={{ borderColor: 'var(--line-14)' }}
            >
              <Download size={15} /> {t('pass_save_print')}
            </button>
          </div>
          <p className="text-center text-xs text-[var(--text-dim)] mt-4">
            {t('pass_disclaimer')}
          </p>
        </div>
      )}
    </AttendeeShell>
  );
}
