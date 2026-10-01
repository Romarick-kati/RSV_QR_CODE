import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { Radio, MapPin, ExternalLink, Users } from 'lucide-react';
import AdminShell from '../../components/layout/AdminShell';
import { useSEO } from '../../lib/useSEO';
import { useVisibilityPolling } from '../../lib/useVisibilityPolling';
import { eventsApi } from '../../lib/api';
import { LogoWatermark } from '../../components/ui/EventLogo';

function ago(iso) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)} min ago`;
}
function dist(m) {
  if (m == null) return '';
  return m < 1000 ? `${m} m from venue` : `${(m / 1000).toFixed(1)} km from venue`;
}

// Radar-style plot with no map library: the venue sits at the centre and each
// person is placed by their real bearing and distance, scaled to fit.
function Radar({ venue, people }) {
  const pts = useMemo(() => {
    if (!venue) return [];
    const toRad = (d) => (d * Math.PI) / 180;
    const raw = people.map((p) => {
      const dx = (p.longitude - venue.longitude) * 111320 * Math.cos(toRad(venue.latitude));
      const dy = (p.latitude - venue.latitude) * 110540;
      return { p, dx, dy };
    });
    const max = Math.max(200, ...raw.map((r) => Math.hypot(r.dx, r.dy))) * 1.15;
    return raw.map((r) => ({ ...r, x: 50 + (r.dx / max) * 46, y: 50 - (r.dy / max) * 46, max }));
  }, [venue, people]);
  const max = pts[0]?.max || 200;
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square rounded-full border overflow-hidden" style={{ borderColor: 'var(--line-12)', background: 'var(--panel)' }}>
      {[1, 2, 3].map((i) => <span key={i} className="absolute rounded-full border" style={{ inset: `${(3 - i) * 16}%`, borderColor: 'var(--line-08)' }} />)}
      <span className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: 'var(--line-08)' }} />
      <span className="absolute top-1/2 left-0 right-0 h-px" style={{ background: 'var(--line-08)' }} />
      <span className="absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2" style={{ left: '50%', top: '50%', background: 'var(--accent-2)', boxShadow: '0 0 0 4px rgba(139,124,246,0.25)' }} title="Venue" />
      {pts.map(({ p, x, y }) => (
        <span key={p.id} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-700" style={{ left: `${x}%`, top: `${y}%` }} title={p.name}>
          <span className="w-3.5 h-3.5 rounded-full animate-pulse" style={{ background: '#22D3A6', boxShadow: '0 0 12px 3px rgba(34,211,166,0.6)' }} />
          <span className="text-[10px] font-semibold mt-1 px-1.5 rounded" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{p.name.split(' ')[0]}</span>
        </span>
      ))}
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-[var(--text-dim)]">edge is about {max >= 1000 ? `${(max / 1000).toFixed(1)} km` : `${Math.round(max)} m`}</span>
    </div>
  );
}

export default function AdminEventLive() {
  useSEO('Live location', undefined, { noindex: true });
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(() => {
    eventsApi.liveList(id).then(setData).catch(() => {});
  }, [id]);

  useEffect(() => {
    eventsApi.get(id).then(({ event: e }) => setEvent(e)).catch(() => setNotFound(true));
    load();
  }, [id, load]);
  useVisibilityPolling(load, 15000);

  if (notFound) return <Navigate to="/admin/events" replace />;
  const people = data?.people || [];

  return (
    <AdminShell title="Live location" subtitle={event ? event.title : 'Loading…'} actions={<Link to={`/admin/events/${id}`} className="text-sm font-semibold underline">Event settings</Link>}>
      {data && !data.enabled && (
        <div className="rounded-2xl border p-5 mb-6 text-sm" style={{ borderColor: 'rgba(245,166,35,0.4)', background: 'rgba(245,166,35,0.08)' }}>
          Live location is off for this event. Open <Link to={`/admin/events/${id}`} className="underline font-semibold">event settings</Link>, tick "Allow attendees to share live location", and save. Attendees still choose for themselves whether to share.
        </div>
      )}
      <div className="relative isolate">
      <LogoWatermark />
      <div className="flex flex-wrap gap-3 mb-6 text-sm">
        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: 'var(--line-12)' }}><Radio size={14} style={{ color: '#22D3A6' }} /> {people.length} sharing now</span>
        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: 'var(--line-12)' }}><Users size={14} /> {data?.registered ?? 0} registered</span>
      </div>
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div>
          {data?.venue ? <Radar venue={data.venue} people={people} /> : (
            <p className="text-sm text-[var(--text-dim)]">Add a map pin (latitude and longitude) to the event to see the radar view. The list still works without it.</p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {people.length === 0 && <p className="text-sm text-[var(--text-dim)]">Nobody is sharing yet. Only attendees who tap "Start sharing" on their pass appear here, and they drop off 15 minutes after their last update. Updates every 15 seconds.</p>}
          {people.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{p.name}</p>
                <p className="text-xs text-[var(--text-dim)]">{[dist(p.distanceMeters), ago(p.updatedAt)].filter(Boolean).join(' · ')}</p>
              </div>
              <a href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border" style={{ borderColor: 'var(--line-12)' }}>
                <MapPin size={12} /> Map <ExternalLink size={11} />
              </a>
            </div>
          ))}
        </div>
      </div>
      </div>
    </AdminShell>
  );
}
