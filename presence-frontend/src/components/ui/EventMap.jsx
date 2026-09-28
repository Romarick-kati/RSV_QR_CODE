import { MapPin, Navigation, ExternalLink } from 'lucide-react';

// Shows where an event is, with no API key and no extra package: an embedded
// Google Map plus plain links that open the full Google Maps app.
// If the organizer pinned an exact point (latitude/longitude) the map shows
// that precise spot; otherwise it falls back to searching the venue text.
// The links are the safety net — if the embed is ever blocked they still work.
export default function EventMap({ venue, latitude, longitude, height = 200 }) {
  const hasPin = Number.isFinite(latitude) && Number.isFinite(longitude);
  const hasVenue = Boolean(venue && venue.trim());
  if (!hasPin && !hasVenue) return null;

  const target = hasPin ? `${latitude},${longitude}` : venue.trim();
  const q = encodeURIComponent(target);
  const embed = hasPin ? `https://www.google.com/maps?q=${q}&z=17&output=embed` : `https://www.google.com/maps?q=${q}&output=embed`;
  const open = `https://www.google.com/maps/search/?api=1&query=${q}`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  const label = hasVenue ? venue.trim() : 'Pinned location';

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }}>
      <iframe
        title={`Map of ${label}`}
        src={embed}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full block border-0"
        style={{ height }}
      />
      <div className="flex items-center gap-2 px-3 py-2.5 text-xs">
        <MapPin size={13} className="shrink-0" style={{ color: '#22D3A6' }} />
        <span className="flex-1 min-w-0 truncate text-[var(--text-dim)]">{label}</span>
        <a href={directions} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold shrink-0" style={{ color: '#22D3A6' }}>
          <Navigation size={12} /> Directions
        </a>
        <a href={open} target="_blank" rel="noopener noreferrer" aria-label="Open in Google Maps" className="shrink-0 text-[var(--text-dim)] hover:text-[var(--text)]">
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}
