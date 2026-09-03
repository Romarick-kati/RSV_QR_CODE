import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, GraduationCap, Briefcase, Wrench, Presentation, Target, Palette, Compass, ArrowRight, Sparkles } from 'lucide-react';
import PublicNav from '../../components/layout/PublicNav';
import PublicFooter from '../../components/layout/PublicFooter';
import EventCard from '../../components/ui/EventCard';
import EmptyState from '../../components/ui/EmptyState';
import { CATEGORIES, EVENT_TINTS } from '../../lib/constants';
import { eventsApi } from '../../lib/api';
import { isEventPast } from '../../lib/utils';
import { useLanguage } from '../../lib/LanguageContext';
import { useSEO } from '../../lib/useSEO';

const ICONS = { Technology: Cpu, Academic: GraduationCap, Corporate: Briefcase, Workshop: Wrench, Seminar: Presentation, Career: Target, Cultural: Palette };

export default function Discover() {
  const { t } = useLanguage();
  useSEO('Discover Events', 'Browse upcoming events by category — technology, academic, career, workshops, and more.');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    eventsApi.listPublic()
      .then(({ events }) => { if (!cancelled) setEvents(events); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const upcoming = useMemo(
    () => events.filter((e) => !isEventPast(e)).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [events]
  );

  // Real counts from real data — no fabricated numbers. A category with
  // zero upcoming events still shows its tile (so the browse experience
  // doesn't feel broken/empty), just with "0 events".
  const countByCategory = useMemo(() => {
    const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
    for (const e of upcoming) counts[e.category] = (counts[e.category] || 0) + 1;
    return counts;
  }, [upcoming]);

  const freeCount = upcoming.filter((e) => !(e.price > 0)).length;
  const thisWeek = upcoming.filter((e) => {
    const days = Math.round((new Date(e.date) - new Date(new Date().toDateString())) / 86400000);
    return days >= 0 && days <= 7;
  });

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-screen overflow-x-hidden">
      <PublicNav />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 pb-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--accent)' }}>
            <Compass size={18} />
            <span className="text-xs font-bold uppercase tracking-wide">Discover</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">Find your next event</h1>
          <p className="text-sm sm:text-base text-[var(--text-dim)] max-w-xl">
            Explore what's coming up, browse by category, or jump straight into what's happening this week.
          </p>
        </motion.div>
      </div>

      {/* Category tiles */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-10">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-dim)] mb-4">Browse by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((cat, i) => {
            const Icon = ICONS[cat] || Cpu;
            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  to={`/events?category=${encodeURIComponent(cat)}`}
                  className="hover-lift group relative flex flex-col justify-between h-28 rounded-2xl overflow-hidden p-4 border"
                  style={{ borderColor: 'var(--line-10)' }}
                >
                  <span className="absolute inset-0 opacity-90" style={{ backgroundImage: EVENT_TINTS[cat] }} />
                  <Icon size={22} className="relative z-10 text-white" />
                  <div className="relative z-10">
                    <p className="text-white font-semibold text-sm">{cat}</p>
                    <p className="text-white/70 text-xs">{countByCategory[cat]} {countByCategory[cat] === 1 ? 'event' : 'events'}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quick filters: free events, this week */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-10 flex flex-wrap gap-3">
        <Link to="/events" className="hover-lift flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold" style={{ borderColor: 'var(--line-12)' }}>
          <Sparkles size={14} style={{ color: 'var(--accent)' }} /> {freeCount} free {freeCount === 1 ? 'event' : 'events'}
        </Link>
        <Link to="/events" className="hover-lift flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold" style={{ borderColor: 'var(--line-12)' }}>
          {thisWeek.length} happening this week
        </Link>
      </div>

      {/* Upcoming events preview */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-dim)]">Coming up</h2>
          <Link to="/events" className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--accent)' }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 rounded-2xl skeleton" />)}
          </div>
        ) : upcoming.length === 0 ? (
          <EmptyState icon={Compass} title="Nothing upcoming yet" description="Check back soon, or browse past events." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcoming.slice(0, 6).map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
          </div>
        )}
      </div>

      <PublicFooter />
    </div>
  );
}
