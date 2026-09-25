import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Users, Mail, ArrowLeft, TriangleAlert, CheckCircle2,
  Cpu, GraduationCap, Briefcase, Wrench, Presentation, Target, Palette, Wallet, Video,
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
  const [joiningMeeting, setJoiningMeeting] = useState(false);
  const [myRegistrationId, setMyRegistrationId] = useState(null);
  const [myWaitlistInfo, setMyWaitlistInfo] = useState(null); // { id, position } | null
  const [showPayment, setShowPayment] = useState(false);
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState({});
  const [justWaitlisted, setJustWaitlisted] = useState(null); // position number, or null
  const [redirecting, setRedirecting] = useState(false);

  useSEO(event?.title, event?.description, { path: `/events/${id}` });

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

  // IMPORTANT: any hook added to this component (useEffect, useState, etc.)
  // MUST go up here, above the early `if (loading) return ...` / `if
  // (notFound) return ...` blocks below — a hook declared after a
  // conditional return runs on some renders and not others (e.g. skipped
  // entirely while `loading` is true, then suddenly present once the event
  // finishes loading), which violates React's Rules of Hooks and throws
  // "Rendered more hooks than during the previous render." That exact bug
  // used to crash this page on every single visit, right at the
  // loading→loaded transition — i.e. exactly when someone clicks into an
  // event. (The payment-status polling that used to live in this spot
  // moved to QrPass.jsx — Fapshi's checkout is a real page redirect, not
  // an in-place phone PIN prompt, so the attendee actually leaves this
  // page entirely while paying and there's nothing to poll for here
  // anymore.)

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
  const hasQuestions = (event.registrationQuestions || []).length > 0;

  async function handleJoinMeeting() {
    setJoiningMeeting(true);
    try {
      const { meetingUrl } = await eventsApi.meetingLink(event.id);
      window.open(meetingUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      push(err instanceof ApiError ? err.message : 'Could not load the meeting link. Please try again.', 'error');
    } finally {
      setJoiningMeeting(false);
    }
  }

  async function handleRsvp() {
    if (!user) {
      navigate('/login', { state: { from: `/events/${event.id}` } });
      return;
    }
    // A paid event needs the email panel, and/or any event with custom
    // registration questions needs those answered — both live in the same
    // "form" panel below, revealed on the first click rather than charging
    // or submitting immediately.
    if ((isPaid || hasQuestions) && !showPayment) {
      setShowPayment(true);
      return;
    }
    if (isPaid && !email.trim()) {
      push('Enter an email address to continue to payment.', 'error');
      return;
    }
    const missingRequired = (event.registrationQuestions || []).filter((q) => q.required && !String(answers[q.label] || '').trim());
    if (missingRequired.length > 0) {
      push(`Please answer: ${missingRequired.map((q) => q.label).join(', ')}`, 'error');
      return;
    }
    setSubmitting(true);
    try {
      const body = (isPaid || hasQuestions) ? { ...(isPaid ? { email: email.trim() } : {}), answers } : undefined;
      const { registration, payment, waitlisted, waitlistPosition } = await eventsApi.rsvp(event.id, body);
      if (waitlisted) {
        setJustWaitlisted(waitlistPosition);
        setMyWaitlistInfo({ id: registration.id });
        setSubmitting(false);
        return;
      }
      if (isPaid && payment?.link) {
        // Fapshi's checkout is a real hosted page, not something that
        // happens in-place — the browser actually leaves this site.
        // QrPass.jsx (where Fapshi's redirectUrl sends the attendee back
        // to) picks up polling for the payment result from here.
        setRedirecting(true);
        window.location.href = payment.link;
      } else {
        push('Registration confirmed, your pass is ready.', 'success');
        navigate(`/qr-pass/${registration.id}`);
      }
    } catch (err) {
      push(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.', 'error');
      setSubmitting(false);
    }
  }


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
        <img src={getSmartEventPhoto(event, '1600/900')} alt="" fetchPriority="high" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
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
            {event.format && event.format !== 'in-person' && (
              <DetailRow icon={Video} label="Format" value={event.format === 'online' ? 'Online' : 'Hybrid (in-person + online)'} />
            )}
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

          {myRegistrationId && event.format && event.format !== 'in-person' && (
            <button
              onClick={handleJoinMeeting}
              disabled={joiningMeeting}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-4 py-3 rounded-xl mb-3 disabled:opacity-60"
              style={{ background: 'rgba(139,124,246,0.14)', color: '#8B7CF6', border: '1px solid rgba(139,124,246,0.3)' }}
            >
              {joiningMeeting
                ? <span className="w-4 h-4 rounded-full border-2 border-[#8B7CF6]/30 border-t-[#8B7CF6] animate-spin" />
                : <Video size={16} />}
              {joiningMeeting ? 'Loading link…' : 'Join online meeting'}
            </button>
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

          {isPaid && !myRegistrationId && !past && !deadlinePassed && !full && showPayment && (
            <div className="rounded-xl border p-4 mb-3" style={{ borderColor: 'rgba(245,166,35,0.35)', background: 'rgba(245,166,35,0.08)' }}>
              <p className="text-xs font-semibold flex items-center gap-1.5 mb-2" style={{ color: '#F5A623' }}>
                <Wallet size={14} /> Pay with Mobile Money
              </p>
              <p className="text-xs text-[var(--text-dim)] leading-relaxed mb-2">
                You'll pay <strong className="text-[var(--text)]">{event.price} FCFA</strong> via a secure Fapshi checkout page (MTN or Orange Money). Enter your email below — your receipt and pass link go there too.
              </p>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                inputMode="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'var(--line-12)', background: 'var(--bg)' }}
              />
              <p className="text-[11px] text-[var(--text-dim)] mt-1.5">
                You'll be redirected to Fapshi to complete payment, then brought straight back here — your pass unlocks automatically the moment it's confirmed.
              </p>
            </div>
          )}

          {hasQuestions && !myRegistrationId && !past && !deadlinePassed && !full && showPayment && (
            <div className="rounded-xl border p-4 mb-3" style={{ borderColor: 'var(--line-12)', background: 'var(--line-04)' }}>
              <p className="text-xs font-semibold mb-3 text-[var(--text)]">A few quick questions from the organizer</p>
              <div className="flex flex-col gap-3">
                {event.registrationQuestions.map((q) => (
                  <label key={q.label} className="block">
                    <span className="block text-xs text-[var(--text-dim)] mb-1">
                      {q.label} {q.required && <span style={{ color: '#FF5C77' }}>*</span>}
                    </span>
                    <input
                      value={answers[q.label] || ''}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.label]: e.target.value }))}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                      style={{ borderColor: 'var(--line-12)', background: 'var(--bg)' }}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={myRegistrationId ? () => navigate(`/qr-pass/${myRegistrationId}`) : handleRsvp}
            disabled={myRegistrationId ? false : (ctaDisabled || submitting || redirecting)}
            className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={ctaDisabled && !myRegistrationId
              ? { background: 'var(--line-08)', color: 'var(--text-dim)' }
              : { background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', color: 'var(--accent-ink)' }}
          >
            {submitting || redirecting
              ? <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              : (myRegistrationId ? t('event_view_pass') : ctaLabel)}
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
