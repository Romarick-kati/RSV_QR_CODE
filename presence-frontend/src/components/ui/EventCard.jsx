import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrochip, faGraduationCap, faBriefcase, faScrewdriverWrench,
  faChalkboardUser, faBullseye, faMasksTheater, faCalendarDays, faLocationDot, faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { formatDate, formatTime, isEventPast } from '../../lib/utils';
import { EVENT_TINTS } from '../../lib/constants';
import { getSmartEventPhoto } from '../../lib/eventPhoto';
import { useLanguage } from '../../lib/LanguageContext';

const CATEGORY_ICON = {
  Technology: faMicrochip, Academic: faGraduationCap, Corporate: faBriefcase,
  Workshop: faScrewdriverWrench, Seminar: faChalkboardUser, Career: faBullseye, Cultural: faMasksTheater,
};

export default function EventCard({ event, index = 0 }) {
  const { t } = useLanguage();
  const [loaded, setLoaded] = useState(false);
  const remaining = event.remaining ?? Math.max((event.capacity || 0) - (event.registered || 0), 0);
  const nearlyFull = remaining <= event.capacity * 0.15 && remaining > 0;
  const full = remaining === 0;
  const past = isEventPast(event);
  const icon = CATEGORY_ICON[event.category] || faMicrochip;

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
            <FontAwesomeIcon icon={icon} className="text-[11px]" /> {event.category}
          </span>
          {past && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/40 text-white/80">{t('events_past')}</span>
          )}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-semibold leading-snug mb-2 text-[var(--text)] group-hover:text-[#22D3A6] transition-colors">
          {event.title}
        </h3>
        <div className="flex flex-col gap-1.5 text-[13px] text-[var(--text-dim)] mb-4">
          <span className="flex items-center gap-1.5"><FontAwesomeIcon icon={faCalendarDays} className="w-3.5" /> {formatDate(event.date)} &middot; {formatTime(event.startTime, event.timezone, event.date)}</span>
          <span className="flex items-center gap-1.5"><FontAwesomeIcon icon={faLocationDot} className="w-3.5" /> {event.venue}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] text-[var(--text-dim)]">
            <FontAwesomeIcon icon={faUsers} className="w-3.5" />
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
