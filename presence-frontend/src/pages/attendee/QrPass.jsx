import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, Clock, MapPin, Download, ArrowLeft, CheckCircle2, TriangleAlert, CalendarPlus, ScanLine, XCircle, Video } from 'lucide-react';
import AttendeeShell from '../../components/layout/AttendeeShell';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import BrandMark from '../../components/ui/BrandMark';
import { useLanguage } from '../../lib/LanguageContext';
import { useToast } from '../../lib/ToastContext';
import { meApi, eventsApi, ApiError } from '../../lib/api';
import { useSEO } from '../../lib/useSEO';
import { formatDateLong, formatTime, formatDateTime, downloadIcsForEvent } from '../../lib/utils';
import { buildCheckinUrl } from '../../lib/checkinUrl';

export default function QrPass() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { push } = useToast();
  useSEO(t('tab_qr_pass'), undefined, { noindex: true });
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joiningMeeting, setJoiningMeeting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    meApi.registration(id)
      .then(({ registration }) => { if (!cancelled) setRegistration(registration); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  // Fapshi redirects the attendee back to exactly this page right after a
  // paid checkout, before its own webhook may have landed yet — so on
  // arrival the registration can still be genuinely `paymentStatus:
  // 'pending'` for a few seconds. This polls (re-verifying with Fapshi
  // directly server-side each time, never trusting a cached value) until
  // it resolves one way or the other. Placed here with the other hooks,
  // above any early return below — see EventDetail.jsx for exactly what
  // goes wrong when a hook ends up after a conditional return instead.
  useEffect(() => {
    if (!registration || registration.paymentStatus !== 'pending') return;
    let cancelled = false;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const { paymentStatus } = await meApi.paymentStatus(id);
        if (cancelled) return;
        if (paymentStatus !== 'pending') {
          clearInterval(interval);
          setRegistration((r) => (r ? { ...r, paymentStatus } : r));
        } else if (attempts >= 60) {
          // ~3 minutes of polling — Fapshi checkout links are valid for up
          // to 24h, but if it's been this long without resolving the
          // attendee has almost certainly navigated away or abandoned the
          // page; stop polling rather than running forever in a background
          // tab. Refreshing this page later re-checks from scratch.
          clearInterval(interval);
        }
      } catch {
        // Transient network error — just try again on the next tick.
      }
    }, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [registration?.paymentStatus, id]);

  function handlePrint() {
    window.print();
  }

  async function handleJoinMeeting() {
    setJoiningMeeting(true);
    try {
      const { meetingUrl } = await eventsApi.meetingLink(registration.event.id);
      window.open(meetingUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      push(err instanceof ApiError ? err.message : 'Could not load the meeting link. Please try again.', 'error');
    } finally {
      setJoiningMeeting(false);
    }
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
      ) : registration.paymentStatus === 'pending' ? (
        <div className="max-w-md mx-auto rounded-[26px] border p-8 text-center" style={{ borderColor: 'rgba(var(--accent-rgb),0.35)', background: 'rgba(var(--accent-rgb),0.06)' }}>
          <span className="w-8 h-8 mx-auto rounded-full border-2 border-t-transparent animate-spin mb-4" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <h2 className="font-display text-lg font-bold mb-2">Confirming your payment</h2>
          <p className="text-sm text-[var(--text-dim)] mb-1">{registration.event.title}</p>
          <p className="text-xs text-[var(--text-dim)] leading-relaxed mt-3">
            This usually takes just a few seconds. If you just completed checkout on Fapshi, your pass will appear here automatically — no need to refresh.
          </p>
        </div>
      ) : registration.paymentStatus === 'failed' ? (
        <div className="max-w-md mx-auto rounded-[26px] border p-8 text-center" style={{ borderColor: 'rgba(255,92,119,0.35)', background: 'rgba(255,92,119,0.06)' }}>
          <span className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(255,92,119,0.16)' }}>
            <XCircle size={22} style={{ color: '#FF5C77' }} />
          </span>
          <h2 className="font-display text-lg font-bold mb-2">Payment didn't go through</h2>
          <p className="text-sm text-[var(--text-dim)] mb-1">{registration.event.title}</p>
          <p className="text-xs text-[var(--text-dim)] leading-relaxed mt-3 mb-5">
            It may have expired or been declined. No charge was made — you can head back to the event and try again.
          </p>
          <Link
            to={`/events/${registration.event.id}`}
            className="inline-block text-sm font-semibold px-4 py-2.5 rounded-lg"
            style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
          >
            Back to event
          </Link>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md mx-auto"
        >
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

            <div
              className={`mx-7 mb-3 rounded-2xl p-6 flex flex-col items-center gap-4 relative overflow-hidden ${!registration.attendance ? 'reticle-pulse' : ''}`}
              style={{ background: '#fff' }}
            >
              <QRCodeSVG value={buildCheckinUrl(registration.attendanceToken)} size={188} bgColor="#ffffff" fgColor="#0A0D18" level="M" />
              <p className="font-mono text-xs tracking-wide text-[#0A0D18]/60">{registration.registrationReference}</p>
              {/* Only sweeps while the pass genuinely hasn't been scanned
                  yet — once checked in, "waiting to be scanned" motion
                  would just be noise, so it stops for good. */}
              {!registration.attendance && <span className="qr-scan-sweep" aria-hidden="true" />}
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
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="mx-7 mb-7 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: 'rgba(34,211,166,0.12)', color: '#22D3A6' }}
              >
                <CheckCircle2 size={16} /> {t('pass_checked_in', { time: formatDateTime(registration.attendance.checkedInAt) })}
              </motion.div>
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

          {registration.event.format && registration.event.format !== 'in-person' && (
            <button
              onClick={handleJoinMeeting}
              disabled={joiningMeeting}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-3.5 rounded-xl mt-5 disabled:opacity-60"
              style={{ background: 'rgba(139,124,246,0.14)', color: '#8B7CF6', border: '1px solid rgba(139,124,246,0.3)' }}
            >
              {joiningMeeting
                ? <span className="w-4 h-4 rounded-full border-2 border-[#8B7CF6]/30 border-t-[#8B7CF6] animate-spin" />
                : <Video size={16} />}
              {joiningMeeting ? 'Loading link…' : 'Join online meeting'}
            </button>
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
        </motion.div>
      )}
    </AttendeeShell>
  );
}
