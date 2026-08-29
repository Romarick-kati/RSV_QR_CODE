import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Users, Mail, ArrowLeft, TriangleAlert, CheckCircle2,
  Cpu, GraduationCap, Briefcase, Wrench, Presentation, Target, Palette, Wallet, Copy,
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
import { formatDateLong, formatTime, isEventPast } from '../../lib/utils';
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
  const [showPayment, setShowPayment] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');

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
  const deadlinePassed = new Date(event.registrationDeadline) < new Date();
  const full = remaining <= 0;
  const isPaid = (event.price || 0) > 0;

  async function handleRsvp() {
    if (!user) {
      navigate('/login', { state: { from: `/events/${event.id}` } });
      return;
    }
    if (isPaid && !showPayment) {
      // First click on a paid event just opens the payment panel instead
      // of registering right away — the reference is required server-side.
      setShowPayment(true);
      return;
    }
    if (isPaid && !paymentReference.trim()) {
      push('Enter the Mobile Money transaction reference to continue.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const { registration } = await eventsApi.rsvp(event.id, isPaid ? { paymentReference: paymentReference.trim() } : undefined);
      push(isPaid ? 'Registered — your pass is ready. It unlocks for check-in once the organizer confirms your payment.' : 'Registration confirmed, your pass is ready.', 'success');
      navigate(`/qr-pass/${registration.id}`);
    } catch (err) {
      push(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.', 'error');
      setSubmitting(false);
    }
  }

  let ctaLabel = isPaid ? `Pay & register — ${event.price} FCFA` : t('event_rsvp');
  let ctaDisabled = false;
  if (past) { ctaLabel = t('event_ended'); ctaDisabled = true; }
  else if (myRegistrationId) { ctaLabel = t('event_registered'); }
  else if (deadlinePassed) { ctaLabel = t('event_registration_closed'); ctaDisabled = true; }
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
            <DetailRow icon={Clock} label={t('event_time')} value={`${formatTime(event.startTime)} – ${formatTime(event.endTime)}`} />
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

          {isPaid && !myRegistrationId && !past && !deadlinePassed && !full && showPayment && (
            <div className="rounded-xl border p-4 mb-3" style={{ borderColor: 'rgba(245,166,35,0.35)', background: 'rgba(245,166,35,0.08)' }}>
              <p className="text-xs font-semibold flex items-center gap-1.5 mb-2" style={{ color: '#F5A623' }}>
                <Wallet size={14} /> Pay with Mobile Money
              </p>
              <p className="text-xs text-[var(--text-dim)] leading-relaxed mb-2">
                Send <strong className="text-[var(--text)]">{event.price} FCFA</strong> to{' '}
                <button
                  type="button"
                  onClick={() => { navigator.clipboard?.writeText(event.momoNumber || ''); push('Number copied.', 'info'); }}
                  className="inline-flex items-center gap-1 font-mono font-semibold text-[var(--text)] underline decoration-dotted"
                >
                  {event.momoNumber || 'the organizer'} <Copy size={11} />
                </button>{' '}
                via MTN/Orange Money, then enter the transaction reference from the confirmation SMS below.
              </p>
              <input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. MP240811.1234.A56789"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'var(--line-12)', background: 'var(--bg)' }}
              />
              <p className="text-[11px] text-[var(--text-dim)] mt-1.5">
                Your seat is held immediately — the organizer confirms payment before your pass will scan at the door.
              </p>
            </div>
          )}

          <button
            onClick={myRegistrationId ? () => navigate(`/qr-pass/${myRegistrationId}`) : handleRsvp}
            disabled={myRegistrationId ? false : (ctaDisabled || submitting)}
            className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={ctaDisabled && !myRegistrationId
              ? { background: 'var(--line-08)', color: 'var(--text-dim)' }
              : { background: 'linear-gradient(135deg,#22D3A6,#8B7CF6)', color: '#04140f' }}
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
