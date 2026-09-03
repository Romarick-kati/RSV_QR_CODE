import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, ScanLine, QrCode, CalendarCheck, BarChart3, ShieldCheck, Zap,
  Smartphone, ClipboardList, Users, ChevronDown,
} from 'lucide-react';
import PublicNav from '../../components/layout/PublicNav';
import PublicFooter from '../../components/layout/PublicFooter';
import CreatorSection from '../../components/layout/CreatorSection';
import EventCard from '../../components/ui/EventCard';
import { eventsApi } from '../../lib/api';
import { useEffect, useState } from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import { useSEO } from '../../lib/useSEO';

const STEPS = [
  { icon: ClipboardList, title: 'Organizer publishes the event', copy: 'Set the date, venue, and capacity. The event goes live on the public site instantly.' },
  { icon: CalendarCheck, title: 'Attendee RSVPs in seconds', copy: 'A short registration form checks capacity and deadlines automatically, no back-and-forth emails.' },
  { icon: QrCode, title: 'A digital pass is issued', copy: 'A unique, non-guessable token is generated and rendered as a QR code on the attendee\u2019s pass.' },
  { icon: ScanLine, title: 'One scan at the door', copy: 'Staff scan the pass with any device camera. The server verifies the token and records the check-in.' },
];

const FEATURES = [
  { icon: ShieldCheck, title: 'Server-verified check-in', copy: 'The QR code only carries a token, so the backend stays the source of truth for validity and duplicates.' },
  { icon: BarChart3, title: 'Live attendance analytics', copy: 'Registrations, check-ins, and capacity utilization update in real time as people arrive.' },
  { icon: Smartphone, title: 'Built for the door', copy: 'The scanner interface is optimized for a phone camera in one hand and a queue in front of you.' },
  { icon: Zap, title: 'No paper sign-in sheets', copy: 'Replace clipboards and spreadsheets with one verified, searchable record per event.' },
];

const FAQS = [
  { q: 'Do attendees need to install an app?', a: 'No. Registration, the digital pass, and QR code all work in the browser, with nothing to install.' },
  { q: 'What happens if a QR code is scanned twice?', a: 'The second scan is rejected with "Already checked in" and no duplicate attendance record is created.' },
  { q: 'Can I export attendance data?', a: 'Yes. Organizers can export a full attendance report per event as CSV from the reports page.' },
];

export default function Landing() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, totalRegistrations: 0, totalCapacity: 0 });
  const [openFaq, setOpenFaq] = useState(0);
  const { t } = useLanguage();
  useSEO(null, 'RSVP to campus and corporate events online, get a digital QR pass, and check in with one verified scan at the door — no more paper sign-in sheets.');

  useEffect(() => {
    let cancelled = false;
    eventsApi.listPublic().then(({ events: all }) => {
      if (cancelled) return;
      setEvents(all.slice(0, 3));
      setStats({
        totalEvents: all.length,
        totalRegistrations: all.reduce((sum, e) => sum + (e.registered || 0), 0),
        totalCapacity: all.reduce((sum, e) => sum + (e.capacity || 0), 0),
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ background: 'var(--bg)' }}>
      <PublicNav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {/* Ambient color glow only — no photo backdrop. This used to
              layer a random blurred stock photo under a gradient that
              faded to a hardcoded dark navy in the middle
              (rgba(10,13,24,...)), which looked fine in dark mode (where
              that navy matches the background) but showed up as a muddy
              grey/brown smear in light mode, since it never adapted to the
              light theme's white background. Matches the clean
              blobs-on-var(--bg) treatment already used on the sign-in
              page, which reads correctly in both themes. */}
          <div className="absolute inset-0 grain opacity-20" />
          <div className="absolute w-[520px] h-[520px] rounded-full blur-[110px] opacity-[0.14] -top-40 -left-32" style={{ background: 'var(--accent)' }} />
          <div className="absolute w-[460px] h-[460px] rounded-full blur-[110px] opacity-[0.11] top-10 right-0" style={{ background: 'var(--accent-2)' }} />
        </div>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 pb-24 relative z-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full mb-6"
              style={{ background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent)' }}
            >
              <ScanLine size={13} /> {t('hero_badge')}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}
              className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold leading-[1.08] mb-6"
            >
              {t('hero_title_1')}<br />{t('hero_title_2')}<br /><span style={{ color: 'var(--accent)' }}>{t('hero_title_3')}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.16 }}
              className="text-[var(--text-dim)] text-lg max-w-xl mb-9 leading-relaxed"
            >
              {t('hero_subtitle')}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.24 }} className="flex flex-wrap items-center gap-3">
              <Link to="/events" className="btn-pop inline-flex items-center gap-2 font-semibold text-sm px-5 py-3.5 rounded-xl" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', color: 'var(--accent-ink)' }}>
                {t('hero_browse')} <ArrowRight size={16} />
              </Link>
              <Link to="/register" className="hover-lift inline-flex items-center gap-2 font-semibold text-sm px-5 py-3.5 rounded-xl border hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--line-14)' }}>
                {t('hero_create_account')}
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }} className="flex flex-wrap gap-x-10 gap-y-4 mt-12">
              <Stat label={t('stat_events_hosted')} value={stats.totalEvents} />
              <Stat label={t('stat_registrations')} value={stats.totalRegistrations} />
              <Stat label={t('stat_seats')} value={stats.totalCapacity} />
            </motion.div>
          </div>

          {/* Signature visual: a digital pass card echoing the scan-target brand mark */}
          <motion.div initial={{ opacity: 0, scale: 0.94, rotate: 2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} className="relative mx-auto w-full max-w-sm">
            <div className="rounded-[26px] border shadow-2xl overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'linear-gradient(160deg,#151b34,#0d1122)' }}>
              <div className="p-6 pb-0">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--pass-text-dim)' }}>{t('pass_title')}</span>
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: 'rgba(var(--accent-rgb),0.14)', color: 'var(--accent)' }}>{t('badge_confirmed')}</span>
                </div>
                <h3 className="font-display text-xl font-semibold leading-snug mb-1" style={{ color: 'var(--pass-text)' }}>University Technology &amp; Innovation Conference</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--pass-text-dim)' }}>Great Hall &middot; Main Campus</p>
              </div>
              <div className="mx-6 mb-6 rounded-2xl p-5 flex items-center gap-5" style={{ background: '#0A0D18', border: '1px dashed rgba(255,255,255,0.15)' }}>
                <div className="w-20 h-20 rounded-xl grid grid-cols-5 grid-rows-5 gap-[3px] p-2 shrink-0" style={{ background: '#fff' }}>
                  {Array.from({ length: 25 }).map((_, i) => (
                    <span key={i} className="rounded-[1px]" style={{ background: [3,4,6,8,9,11,12,13,16,18,19,21,22].includes(i) ? '#0A0D18' : 'transparent' }} />
                  ))}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: 'var(--pass-text-dim)' }}>Reference</p>
                  <p className="font-mono text-sm" style={{ color: 'var(--pass-text)' }}>PRES-2026-00001</p>
                  <p className="text-[11px] uppercase tracking-wide mt-3 mb-1" style={{ color: 'var(--pass-text-dim)' }}>{t('pass_attendee')}</p>
                  <p className="text-sm" style={{ color: 'var(--pass-text)' }}>Aisha Bello</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-14 h-14 rounded-2xl flex items-center justify-center reticle-pulse" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))' }}>
              <ScanLine size={22} color="var(--accent-ink)" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 border-t" style={{ borderColor: 'var(--line-08)' }}>
        <SectionHeading eyebrow="How it works" title="From RSVP to verified check-in" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border p-6" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
              <span className="font-mono text-xs text-[var(--text-dim)]">0{i + 1}</span>
              <span className="w-11 h-11 rounded-xl flex items-center justify-center my-4" style={{ background: 'rgba(var(--accent-rgb),0.12)' }}>
                <s.icon size={20} style={{ color: 'var(--accent)' }} />
              </span>
              <h3 className="font-display text-base font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-[var(--text-dim)] leading-relaxed">{s.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 border-t" style={{ borderColor: 'var(--line-08)' }}>
        <SectionHeading eyebrow="Why Presence" title="Built for the door, not just the spreadsheet" />
        <div className="grid sm:grid-cols-2 gap-5 mt-12">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4 rounded-2xl border p-6" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
              <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(139,124,246,0.14)' }}>
                <f.icon size={20} style={{ color: 'var(--accent-2)' }} />
              </span>
              <div>
                <h3 className="font-display text-base font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-[var(--text-dim)] leading-relaxed">{f.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PHOTO BANNER */}
      <section className="border-t" style={{ borderColor: 'var(--line-08)' }}>
        <div className="relative h-64 sm:h-80 overflow-hidden">
          <motion.img
            src="https://picsum.photos/seed/presence-banner/1600/500"
            alt="Attendees checking in at a campus event"
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(10,13,24,0.88), rgba(10,13,24,0.35))' }} />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="max-w-md"
              >
                <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>On the ground</span>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white mt-2 mb-3">Built for the actual door, not a demo</h2>
                <p className="text-sm text-white/75 leading-relaxed">Every screen in Presence was designed around one moment: someone arriving at an event and needing to get in fast.</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* EVENT DISCOVERY PREVIEW */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 border-t" style={{ borderColor: 'var(--line-08)' }}>
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <SectionHeading eyebrow="Discover" title="Upcoming events" />
          <Link to="/events" className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
            View all events <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
        </div>
      </section>

      {/* STATS BAND */}
      <section className="border-y" style={{ borderColor: 'var(--line-08)', background: 'var(--panel-2)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 grid grid-cols-2 sm:grid-cols-4 gap-8">
          <BigStat icon={CalendarCheck} label="Events managed" value={stats.totalEvents} />
          <BigStat icon={Users} label={t('stat_registrations')} value={stats.totalRegistrations} />
          <BigStat icon={ScanLine} label={t('stat_seats')} value={stats.totalCapacity} />
          <BigStat icon={BarChart3} label="Live QR check-in" value="Enabled" />
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-20">
        <SectionHeading eyebrow="FAQ" title="Common questions" center />
        <div className="mt-10 flex flex-col gap-3">
          {FAQS.map((f, i) => (
            <div key={f.q} className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                <span className="font-medium text-[var(--text)] text-sm">{f.q}</span>
                <ChevronDown size={16} className="text-[var(--text-dim)] transition-transform shrink-0" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none' }} />
              </button>
              {openFaq === i && <p className="px-5 pb-4 text-sm text-[var(--text-dim)] leading-relaxed">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-24">
        <div className="rounded-[28px] border p-12 text-center relative overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'linear-gradient(160deg,#151b34,#0d1122)' }}>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(var(--accent-rgb),0.14), transparent 60%)' }} />
          <div className="relative z-10">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-3" style={{ color: 'var(--pass-text)' }}>Ready to replace the sign-in sheet?</h2>
            <p className="max-w-md mx-auto mb-7" style={{ color: 'var(--pass-text-dim)' }}>Create an account, RSVP to an event, and see your digital pass generate in seconds.</p>
            <Link to="/register" className="btn-pop inline-flex items-center gap-2 font-semibold text-sm px-6 py-3.5 rounded-xl" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', color: 'var(--accent-ink)' }}>
              Get started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <CreatorSection />

      <PublicFooter />
    </div>
  );
}

function SectionHeading({ eyebrow, title, center }) {
  return (
    <div className={center ? 'text-center' : ''}>
      <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: '#F5A623' }}>{eyebrow}</span>
      <h2 className="font-display text-2xl sm:text-3xl font-semibold mt-2">{title}</h2>
    </div>
  );
}
function Stat({ label, value }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold text-[var(--text)]">
        {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </p>
      <p className="text-xs text-[var(--text-dim)] mt-0.5">{label}</p>
    </div>
  );
}
function BigStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(var(--accent-rgb),0.12)' }}>
        <Icon size={18} style={{ color: 'var(--accent)' }} />
      </span>
      <div>
        <p className="font-display text-xl font-semibold text-[var(--text)] leading-tight">
          {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
        </p>
        <p className="text-xs text-[var(--text-dim)]">{label}</p>
      </div>
    </div>
  );
}
