import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Users, Mail, ArrowLeft, TriangleAlert, CheckCircle2,
  Cpu, GraduationCap, Briefcase, Wrench, Presentation, Target, Palette, Wallet,
} from 'lucide-react';
import PublicNav from '../../components/layout/PublicNav';
import PublicFooter from '../../components/layout/PublicFooter';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { useLanguage } from '../../lib/LanguageContext';
import { eventsApi, meApi, ApiError } from '../../lib/api';
import { EVENT_TINTS } from '../../lib/constants';
import { getSmartEventPhoto } from '../../lib/eventPhoto';
import { formatDateLong, formatTime, isEventPast, isRegistrationDeadlinePassed } from '../../lib/utils';
import { useSEO } from '../../lib/useSEO';

const ICONS = { Technology: Cpu, Academic: GraduationCap, Corporate: Briefcase, Workshop: Wrench, Seminar: Presentation, Career: Target, Cultural: Palette };

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { push } = useToast();
  const { t } = useLanguage();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myRegistrationId, setMyRegistrationId] = useState(null);
  const [myWaitlistInfo, setMyWaitlistInfo] = useState(null); // { id, position } | null
  const [showPayment, setShowPayment] = useState(false);
  const [phone, setPhone] = useState('');
  // 'idle' | 'awaiting-pin' | 'confirmed' | 'failed'
  const [paymentState, setPaymentState] = useState('idle');
  const [pendingRegistrationId, setPendingRegistrationId] = useState(null);
  const [justWaitlisted, setJustWaitlisted] = useState(null); // position number, or null

  useSEO(event?.title, event?.description);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    eventsApi.get(id)
      .then(({ event }) => { if (!cancelled) setEvent(event); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  // If signed in, check whether the attendee already holds a confirmed
  // registration for this event so the CTA can offer "View my pass" instead.
  useEffect(() => {
    if (!user || user.role !== 'ATTENDEE') return;
    let cancelled = false;
    meApi.myEvents().then(({ registrations }) => {
      if (cancelled) return;
      const match = registrations.find((r) => r.eventId === id && r.status === 'confirmed');
      setMyRegistrationId(match?.id || null);
      const waiting = registrations.find((r) => r.eventId === id && r.status === 'waitlisted');
      setMyWaitlistInfo(waiting ? { id: waiting.id } : null);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user, id]);

  if (loading) {
    return (
      <div style={{ background: 'var(--bg)' }} className="min-h-screen overflow-x-hidden">
        <PublicNav />
        <div className="max-w-5xl mx-auto px-5 py-16">
          <div className="h-64 rounded-2xl skeleton mb-8" />
          <div className="h-5 w-2/3 rounded skeleton mb-3" />
          <div className="h-4 w-1/2 rounded skeleton" />
        </div>
      </div>
    );
  }

  if (notFound || !event || event.status === 'draft') {
    return (
      <div style={{ background: 'var(--bg)' }} className="min-h-screen overflow-x-hidden">
        <PublicNav />
        <div className="max-w-3xl mx-auto px-5 py-20">
          <EmptyState
            icon={TriangleAlert}
            title={t('event_not_found_title')}
            description={t('event_not_found_desc')}
            action={<Link to="/events" className="text-sm font-semibold px-4 py-2 rounded-lg inline-block" style={{ background: '#22D3A6', color: '#04140f' }}>{t('event_back')}</Link>}
          />
        </div>
        <PublicFooter />
      </div>
    );
  }

  const Icon = ICONS[event.category] || Cpu;
  const remaining = event.remaining ?? Math.max(event.capacity - (event.registered || 0), 0);
  const past = isEventPast(event);
  const deadlinePassed = isRegistrationDeadlinePassed(event);
  const full = remaining <= 0;
  const isPaid = (event.price || 0) > 0;

  async function handleRsvp() {
    if (!user) {
      navigate('/login', { state: { from: `/events/${event.id}` } });
      return;
    }
    if (isPaid && !showPayment) {
      // First click on a paid event just opens the phone-number panel
      // instead of charging right away.
      setShowPayment(true);
      return;
    }
    if (isPaid && !phone.trim()) {
      push('Enter the Mobile Money phone number to continue.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const { registration, payment, waitlisted, waitlistPosition } = await eventsApi.rsvp(event.id, isPaid ? { phone: phone.trim() } : undefined);
      if (waitlisted) {
        setJustWaitlisted(waitlistPosition);
        setMyWaitlistInfo({ id: registration.id });
        setSubmitting(false);
        return;
      }
      if (isPaid && payment) {
        // A real PIN-approval prompt is now on the attendee's phone —
        // don't navigate away yet, poll until CamPay confirms it.
        setPendingRegistrationId(registration.id);
        setPaymentState('awaiting-pin');
        setSubmitting(false);
      } else {
        push('Registration confirmed, your pass is ready.', 'success');
        navigate(`/qr-pass/${registration.id}`);
      }
    } catch (err) {
      push(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.', 'error');
      setSubmitting(false);
    }
  }

  // Polls the real CamPay-verified payment status every 3s while the
  // attendee is looking at the "check your phone" screen. Stops on a
  // definitive outcome or after ~2 minutes (CamPay prompts typically time
  // out well before that if never approved).
  useEffect(() => {
    if (paymentState !== 'awaiting-pin' || !pendingRegistrationId) return;
    let cancelled = false;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const { paymentStatus } = await meApi.paymentStatus(pendingRegistrationId);
        if (cancelled) return;
        if (paymentStatus === 'confirmed') {
          clearInterval(interval);
          setPaymentState('confirmed');
          push('Payment confirmed — your pass is ready.', 'success');
          navigate(`/qr-pass/${pendingRegistrationId}`);
        } else if (paymentStatus === 'failed') {
          clearInterval(interval);
          setPaymentState('failed');
        } else if (attempts >= 40) {
          clearInterval(interval);
          setPaymentState('failed');
        }
      } catch {
        // Transient network error — just try again on the next tick.
      }
    }, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [paymentState, pendingRegistrationId, navigate, push]);

  const waitlistable = full && !isPaid; // paid waitlist unsupported, see rsvp.controller.js
  let ctaLabel = isPaid ? `Pay & register — ${event.price} FCFA` : t('event_rsvp');
  let ctaDisabled = false;
  if (past) { ctaLabel = t('event_ended'); ctaDisabled = true; }
  else if (myRegistrationId) { ctaLabel = t('event_registered'); }
  else if (myWaitlistInfo) { ctaLabel = "You're on the waitlist"; ctaDisabled = true; }
  else if (justWaitlisted) { ctaLabel = "You're on the waitlist"; ctaDisabled = true; }
  else if (deadlinePassed) { ctaLabel = t('event_registration_closed'); ctaDisabled = true; }
  else if (full && waitlistable) { ctaLabel = 'Join the waitlist'; }
  else if (full) { ctaLabel = t('event_fully_booked'); ctaDisabled = true; }
  else if (showPayment) { ctaLabel = 'Confirm registration'; }

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-screen overflow-x-hidden">
      <PublicNav />

      <div className="relative h-64 sm:h-80 flex items-end overflow-hidden">
        <img src={getSmartEventPhoto(event, '1600/900')} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: EVENT_TINTS[event.category] }} />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 w-full pb-8 relative z-10">
          <Link to="/events" className="inline-flex items-center gap-1.5 text-white/85 text-sm font-medium mb-4 hover:text-white">
            <ArrowLeft size={15} /> {t('event_back')}
          </Link>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white mb-3 w-fit">
            <Icon size={12} /> {event.category}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white max-w-2xl leading-tight">{event.title}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 grid lg:grid-cols-[1fr_340px] gap-10">
        <div>
          <h2 className="font-display text-lg font-semibold mb-3">{t('event_about')}</h2>
          <p className="text-[var(--text-dim)] leading-relaxed mb-8">{event.longDescription || event.description}</p>

          <h2 className="font-display text-lg font-semibold mb-3">{t('event_details')}</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <DetailRow icon={Calendar} label={t('event_date')} value={formatDateLong(event.date)} />
            <DetailRow icon={Clock} label={t('event_time')} value={`${formatTime(event.startTime, event.timezone, event.date)} – ${formatTime(event.endTime, event.timezone, event.date)}`} />
            <DetailRow icon={MapPin} label={t('event_venue')} value={event.venue} />
            <DetailRow icon={Users} label={t('event_capacity')} value={`${event.capacity} ${t('event_attendees_suffix')}`} />
            <DetailRow icon={Mail} label={t('event_organizer')} value={event.organizer?.name || 'Presence'} />
            {event.contact && <DetailRow icon={Mail} label={t('event_contact')} value={event.contact} />}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border p-6" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
          <div className="flex items-center justify-between mb-4">
            <Badge status={past ? 'completed' : 'published'} />
            <span className="text-sm text-[var(--text-dim)]">{full ? t('event_fully_booked') : t('event_spots_of', { remaining, capacity: event.capacity })}</span>
          </div>
          <div className="h-1.5 rounded-full mb-5" style={{ background: 'var(--line-08)' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round(((event.capacity - remaining) / event.capacity) * 100))}%`, background: full ? '#FF5C77' : '#22D3A6' }} />
          </div>
          <p className="text-xs text-[var(--text-dim)] mb-5">{t('event_deadline', { date: formatDateLong(event.registrationDeadline) })}</p>

          {myRegistrationId && (
            <div className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2.5 mb-3" style={{ background: 'rgba(34,211,166,0.12)', color: '#22D3A6' }}>
              <CheckCircle2 size={16} /> {t('event_registered_banner')}
            </div>
          )}

          {(myWaitlistInfo || justWaitlisted) && !myRegistrationId && (
            <div className="rounded-xl border p-4 mb-3" style={{ borderColor: 'rgba(139,124,246,0.35)', background: 'rgba(139,124,246,0.08)' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#8B7CF6' }}>
                You're on the waitlist{justWaitlisted ? ` — #${justWaitlisted}` : ''}
              </p>
              <p className="text-xs text-[var(--text-dim)]">
                We'll automatically confirm your spot the moment someone cancels — no need to check back, you'll just see it appear in "My Events".
              </p>
            </div>
          )}

          {isPaid && !myRegistrationId && !past && !deadlinePassed && !full && showPayment && paymentState === 'idle' && (
            <div className="rounded-xl border p-4 mb-3" style={{ borderColor: 'rgba(245,166,35,0.35)', background: 'rgba(245,166,35,0.08)' }}>
              <p className="text-xs font-semibold flex items-center gap-1.5 mb-2" style={{ color: '#F5A623' }}>
                <Wallet size={14} /> Pay with Mobile Money
              </p>
              <p className="text-xs text-[var(--text-dim)] leading-relaxed mb-2">
                You'll pay <strong className="text-[var(--text)]">{event.price} FCFA</strong> via MTN or Orange Money. Enter your number below — you'll get a prompt on your phone to approve with your PIN.
              </p>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                inputMode="tel"
                placeholder="e.g. 677 12 34 56"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'var(--line-12)', background: 'var(--bg)' }}
              />
              <p className="text-[11px] text-[var(--text-dim)] mt-1.5">
                Your pass unlocks the moment the payment is confirmed — usually within a few seconds of approving on your phone.
              </p>
            </div>
          )}

          {isPaid && paymentState === 'awaiting-pin' && (
            <div className="rounded-xl border p-4 mb-3 text-center" style={{ borderColor: 'rgba(34,211,166,0.35)', background: 'rgba(var(--accent-rgb),0.08)' }}>
              <span className="w-8 h-8 mx-auto rounded-full border-2 border-t-transparent animate-spin mb-3" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
              <p className="text-sm font-semibold mb-1">Check your phone</p>
              <p className="text-xs text-[var(--text-dim)] leading-relaxed">
                Approve the payment prompt on <span className="font-mono text-[var(--text)]">{phone}</span> with your Mobile Money PIN. This updates automatically once confirmed.
              </p>
            </div>
          )}

          {isPaid && paymentState === 'failed' && (
            <div className="rounded-xl border p-4 mb-3" style={{ borderColor: 'rgba(255,92,119,0.35)', background: 'rgba(255,92,119,0.08)' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#FF5C77' }}>Payment didn't go through</p>
              <p className="text-xs text-[var(--text-dim)] mb-3">It may have timed out or been declined. You can try again.</p>
              <button
                type="button"
                onClick={() => { setPaymentState('idle'); setPendingRegistrationId(null); }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
              >
                Try again
              </button>
            </div>
          )}

          <button
            onClick={myRegistrationId ? () => navigate(`/qr-pass/${myRegistrationId}`) : handleRsvp}
            disabled={myRegistrationId ? false : (ctaDisabled || submitting || paymentState === 'awaiting-pin')}
            className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={ctaDisabled && !myRegistrationId
              ? { background: 'var(--line-08)', color: 'var(--text-dim)' }
              : { background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', color: 'var(--accent-ink)' }}
          >
            {submitting ? <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" /> : (myRegistrationId ? t('event_view_pass') : ctaLabel)}
          </button>
        </aside>
      </div>

      <PublicFooter />
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--line-05)' }}>
        <Icon size={16} className="text-[var(--text-dim)]" />
      </span>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-[var(--text-dim)]">{label}</p>
        <p className="text-sm text-[var(--text)] font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}
