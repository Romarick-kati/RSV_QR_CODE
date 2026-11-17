import { useEffect, useRef, useState } from 'react';
import { MapPin, Radio, Square, ShieldCheck } from 'lucide-react';
import { eventsApi } from '../../lib/api';

const SEND_EVERY_MS = 20000;

// Opt-in live location for one event. Nothing is sent until the person taps
// "Start sharing". Sharing only runs while this page stays open (web pages
// cannot track in the background), stops the moment they tap Stop or leave,
// and stopping deletes their last position on the server.
export default function LiveLocationShare({ eventId }) {
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const watchId = useRef(null);
  const lastSent = useRef(0);
  const active = useRef(false);

  function clearWatch() {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
  }

  async function push(pos) {
    const now = Date.now();
    if (now - lastSent.current < SEND_EVERY_MS) return;
    lastSent.current = now;
    try {
      await eventsApi.liveShare(eventId, {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
      if (active.current) setStatus(`Last shared at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err) {
      if (active.current) setError(err.message || 'Could not share your location.');
    }
  }

  function start() {
    setError('');
    if (!navigator.geolocation) { setError('This device or browser does not support location.'); return; }
    active.current = true;
    lastSent.current = 0;
    setSharing(true);
    setStatus('Finding your position…');
    watchId.current = navigator.geolocation.watchPosition(
      push,
      (e) => {
        active.current = false;
        clearWatch();
        setSharing(false);
        setStatus('');
        setError(e.code === 1 ? 'Location permission was denied. Allow it in your browser settings to share.' : 'Could not read your location. Try again outdoors or check your GPS.');
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
  }

  async function stop() {
    active.current = false;
    clearWatch();
    setSharing(false);
    setStatus('');
    try { await eventsApi.liveStop(eventId); } catch { /* the row also expires on its own */ }
  }

  // Leaving the page ends sharing and removes the stored position.
  useEffect(() => () => {
    if (active.current) {
      active.current = false;
      clearWatch();
      eventsApi.liveStop(eventId).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-7 mb-7 rounded-2xl border p-4" style={{ borderColor: sharing ? 'rgba(34,211,166,0.5)' : 'rgba(255,255,255,0.12)', background: sharing ? 'rgba(34,211,166,0.08)' : 'rgba(255,255,255,0.03)' }}>
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(34,211,166,0.15)' }}>
          {sharing ? <Radio size={17} className="animate-pulse" style={{ color: '#22D3A6' }} /> : <MapPin size={17} style={{ color: '#22D3A6' }} />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--pass-text)' }}>{sharing ? 'Sharing your live location' : 'Share your live location'}</p>
          <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'var(--pass-text-dim)' }}>
            {sharing
              ? (status || 'Sharing…')
              : "The organizer turned this on for the event. Only they can see where you are, only while you share, and you can stop anytime."}
          </p>
        </div>
      </div>
      {error && <p className="text-xs mt-3" style={{ color: '#FF5C77' }}>{error}</p>}
      {sharing && <p className="text-[11px] mt-2 flex items-center gap-1" style={{ color: 'var(--pass-text-dim)' }}><ShieldCheck size={12} /> Keep this page open. Leaving it stops sharing.</p>}
      <button type="button" onClick={sharing ? stop : start} className="mt-3 w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl" style={sharing ? { background: 'rgba(255,92,119,0.15)', color: '#FF5C77' } : { background: '#22D3A6', color: '#0A0D18' }}>
        {sharing ? <><Square size={14} /> Stop sharing</> : <><Radio size={14} /> Start sharing</>}
      </button>
    </div>
  );
}
