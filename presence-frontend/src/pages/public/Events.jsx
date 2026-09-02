import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, CalendarX } from 'lucide-react';
import PublicNav from '../../components/layout/PublicNav';
import PublicFooter from '../../components/layout/PublicFooter';
import EventCard from '../../components/ui/EventCard';
import EmptyState from '../../components/ui/EmptyState';
import { CATEGORIES } from '../../lib/constants';
import { eventsApi } from '../../lib/api';
import { isEventPast } from '../../lib/utils';
import { useLanguage } from '../../lib/LanguageContext';
import { useSEO } from '../../lib/useSEO';

export default function Events() {
  const { t } = useLanguage();
  useSEO('Browse Events', 'Browse upcoming technology conferences, workshops, seminars, and career fairs. RSVP online and get your QR pass instantly.');
  const [searchParams] = useSearchParams();
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  // Seeded from the URL (?category=Technology) so links from the Discover
  // page land with the right filter already applied, instead of dumping
  // the visitor on an unfiltered list they have to re-filter themselves.
  const [category, setCategory] = useState(() => searchParams.get('category') || 'All');
  const [timeframe, setTimeframe] = useState('upcoming');
  const [sort, setSort] = useState('date-asc');

  const SORTS = [
    { value: 'date-asc', label: t('events_sort_soonest') },
    { value: 'date-desc', label: t('events_sort_latest') },
    { value: 'title-asc', label: t('events_sort_title') },
  ];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    eventsApi.listPublic()
      .then(({ events }) => { if (!cancelled) { setAllEvents(events); setError(''); } })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let list = allEvents.filter((e) => {
      const matchesQ = !q || e.title.toLowerCase().includes(q.toLowerCase()) || e.venue.toLowerCase().includes(q.toLowerCase());
      const matchesCategory = category === 'All' || e.category === category;
      const matchesTime = timeframe === 'all' || (timeframe === 'upcoming' ? !isEventPast(e) : isEventPast(e));
      return matchesQ && matchesCategory && matchesTime;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'date-asc') return String(a.date).localeCompare(String(b.date));
      if (sort === 'date-desc') return String(b.date).localeCompare(String(a.date));
      return a.title.localeCompare(b.title);
    });
    return list;
  }, [allEvents, q, category, timeframe, sort]);

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-screen overflow-x-hidden">
      <PublicNav />

      <div className="border-b" style={{ borderColor: 'var(--line-08)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-12 pb-8">
          <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: '#F5A623' }}>{t('events_eyebrow')}</span>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-2 mb-2">{t('events_title')}</h1>
          <p className="text-[var(--text-dim)]">{loading ? t('events_loading') : t('events_count', { n: allEvents.length })}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('events_search_placeholder')}
              className="w-full rounded-xl border pl-10 pr-4 py-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-dim)]"
              style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }}
            />
          </div>
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="rounded-xl border px-4 py-3 text-sm text-[var(--text)] outline-none" style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }}>
            <option value="upcoming">{t('events_upcoming')}</option>
            <option value="past">{t('events_past')}</option>
            <option value="all">{t('events_all_dates')}</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-xl border px-4 py-3 text-sm text-[var(--text)] outline-none" style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <SlidersHorizontal size={14} className="text-[var(--text-dim)] mr-1" />
          {['All', ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="text-[13px] font-medium px-3.5 py-1.5 rounded-full border transition-colors"
              style={category === c
                ? { background: '#22D3A6', color: '#04140f', borderColor: '#22D3A6' }
                : { color: 'var(--text-dim)', borderColor: 'var(--line-12)' }}
            >
              {c === 'All' ? t('events_category_all') : c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 rounded-2xl skeleton" />)}
          </div>
        ) : error ? (
          <EmptyState icon={CalendarX} title={t('events_error_title')} description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title={t('events_empty_title')}
            description={t('events_empty_desc')}
            action={<button onClick={() => { setQ(''); setCategory('All'); setTimeframe('all'); }} className="text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: '#22D3A6', color: '#04140f' }}>{t('events_clear_filters')}</button>}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
          </div>
        )}
      </div>

      <PublicFooter />
    </div>
  );
}
