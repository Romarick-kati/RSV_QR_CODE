import { useState } from 'react';
import { LocateFixed, X, MapPin } from 'lucide-react';
import EventMap from '../ui/EventMap';
import { parseMapLocation, formatCoords } from '../../lib/mapLocation';

// Lets the organizer pin the exact spot so attendees get a precise map and
// directions. Three ways in, none needing an API key: paste a Google Maps
// link, type "latitude, longitude", or tap "Use my current location" while
// standing at the venue.
export default function MapLocationField({ venue, latitude, longitude, onChange }) {
  const [text, setText] = useState(() => formatCoords(latitude, longitude));
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const hasPin = Number.isFinite(latitude) && Number.isFinite(longitude);

  function handleText(value) {
    setText(value);
    const r = parseMapLocation(value);
    if (r.empty) { setError(''); onChange({ latitude: null, longitude: null }); return; }
    if (r.error) { setError(r.error); onChange({ latitude: null, longitude: null }); return; }
    setError('');
    onChange({ latitude: r.latitude, longitude: r.longitude });
  }

  function useMyLocation() {
    if (!navigator.geolocation) { setError('Your browser cannot share its location.'); return; }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = Number(pos.coords.latitude.toFixed(6));
        const longitude = Number(pos.coords.longitude.toFixed(6));
        setText(formatCoords(latitude, longitude));
        onChange({ latitude, longitude });
        setLocating(false);
      },
      () => { setError('Could not get your location. Allow location access, or paste a Google Maps link instead.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  function clear() {
    setText('');
    setError('');
    onChange({ latitude: null, longitude: null });
  }

  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-xs font-semibold text-[var(--text-dim)] flex items-center gap-1.5">
        <MapPin size={13} style={{ color: '#22D3A6' }} /> Exact map location <span className="font-normal">(optional, recommended)</span>
      </label>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => handleText(e.target.value)}
          placeholder="Paste a Google Maps link or 4.0511, 9.7679"
          className="input flex-1 min-w-0"
        />
        {text && (
          <button type="button" onClick={clear} aria-label="Clear map location" className="w-10 shrink-0 rounded-lg border flex items-center justify-center hover:bg-white/5" style={{ borderColor: 'var(--line-12)' }}>
            <X size={15} />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="self-start inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-white/5 disabled:opacity-60"
        style={{ borderColor: 'var(--line-12)' }}
      >
        <LocateFixed size={14} style={{ color: '#22D3A6' }} /> {locating ? 'Locating…' : 'Use my current location'}
      </button>
      {error && <p className="text-xs" style={{ color: 'var(--danger-text)' }}>{error}</p>}
      {hasPin && <EventMap venue={venue} latitude={latitude} longitude={longitude} height={180} />}
      {!hasPin && !error && (
        <p className="text-xs text-[var(--text-dim)]">Without a pin, the map is found by searching the venue name — so include the town or area in the venue.</p>
      )}
    </div>
  );
}
