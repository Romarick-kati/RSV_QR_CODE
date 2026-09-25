import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, GraduationCap, Briefcase, Wrench, Presentation, Target, Drama, Calendar, MapPin, Users, Video } from 'lucide-react';
import { formatDate, formatTime, isEventPast } from '../../lib/utils';
import { EVENT_TINTS } from '../../lib/constants';
import { getSmartEventPhoto } from '../../lib/eventPhoto';
import { useLanguage } from '../../lib/LanguageContext';

// lucide-react rather than FontAwesome deliberately — lucide is already a
// dependency used everywhere else in the app, so reusing it here adds zero
// extra bytes. FontAwesome was previously imported just for these 10
// icons, but since EventCard renders on the homepage (not lazy-loaded),
// that pulled its ~36KB gzipped runtime into the bundle every visitor
// downloads before seeing anything — for icons lucide already covers.
const CATEGORY_ICON = {
  Technology: Cpu, Academic: GraduationCap, Corporate: Briefcase,
  Workshop: Wrench, Seminar: Presentation, Career: Target, Cultural: Drama,
};

export default function EventCard({ event, index = 0 }) {
  const { t } = useLanguage();
  const [loaded, setLoaded] = useState(false);
  const remaining = event.remaining ?? Math.max((event.capacity || 0) - (event.registered || 0), 0);
  const nearlyFull = remaining <= event.capacity * 0.15 && remaining > 0;
  const full = remaining === 0;
  const past = isEventPast(event);
  const CategoryIcon = CATEGORY_ICON[event.category] || Cpu;

  return (
    <Link
      to={`/events/${event.id}`}
      className="group block rounded-2xl overflow-hidden border animate-fadeUp"
      style={{ borderColor: 'var(--line-08)', background: 'var(--panel)', animationDelay: `${index * 60}ms`, opacity: 0 }}
    >
      <div className="relative h-40 overflow-hidden">
        {!loaded && <div className="absolute inset-0 skeleton" />}
        <motion.img
          src={getSmartEventPhoto(event)}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            // An uploaded/Unsplash image URL can go dead (deleted, expired,
            // network blip) — fall back to the local gradient placeholder
            // instead of leaving the card stuck on the skeleton forever.
            const fallback = getSmartEventPhoto({ ...event, image: null });
            if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
            setLoaded(true);
          }}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: loaded ? 1 : 0 }}
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0" style={{ background: EVENT_TINTS[event.category] }} />
        <div className="absolute inset-0 flex items-start justify-between p-4">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white">
            <CategoryIcon size={11} /> {event.category}
          </span>
          {past ? (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/40 text-white/80">{t('events_past')}</span>
          ) : event.format && event.format !== 'in-person' && (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white">
              <Video size={11} /> {event.format === 'online' ? 'Online' : 'Hybrid'}
            </span>
          )}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-semibold leading-snug mb-2 text-[var(--text)] group-hover:text-[#22D3A6] transition-colors">
          {event.title}
        </h3>
        <div className="flex flex-col gap-1.5 text-[13px] text-[var(--text-dim)] mb-4">
          <span className="flex items-center gap-1.5"><Calendar size={13} /> {formatDate(event.date)} &middot; {formatTime(event.startTime, event.timezone, event.date)}</span>
          <span className="flex items-center gap-1.5"><MapPin size={13} /> {event.venue}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] text-[var(--text-dim)]">
            <Users size={13} />
            {full ? t('events_fully_booked') : t('events_spots_left', { n: remaining })}
          </span>
          {nearlyFull && !full && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,92,119,0.14)', color: '#FF5C77' }}>
              {t('events_almost_full')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
