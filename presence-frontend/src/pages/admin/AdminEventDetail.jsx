import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link, Navigate, NavLink } from 'react-router-dom';
import { Users, ScanLine, BarChart3, ExternalLink } from 'lucide-react';
import AdminShell from '../../components/layout/AdminShell';
import { useSEO } from '../../lib/useSEO';
import EventForm from '../../components/admin/EventForm';
import EventShareLink from '../../components/admin/EventShareLink';
import Badge from '../../components/ui/Badge';
import { eventsApi } from '../../lib/api';
import { useToast } from '../../lib/ToastContext';

export default function AdminEventDetail() {
  useSEO('Manage Event', undefined, { noindex: true });
  const { id } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([eventsApi.get(id), eventsApi.statistics(id)])
      .then(([e, s]) => { if (!cancelled) { setEvent(e.event); setStats(s); } })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    // Keep the Registered/Checked-in numbers live while this page is open,
    // so check-ins happening at the scanner right now show up here too.
    const interval = setInterval(() => {
      eventsApi.statistics(id).then((s) => { if (!cancelled) setStats(s); }).catch(() => {});
    }, 4000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [id]);

  if (notFound) return <Navigate to="/admin/events" replace />;
  if (loading || !event) {
    return (
      <AdminShell title="Loading…" subtitle="">
        <div className="h-96 rounded-2xl skeleton" />
      </AdminShell>
    );
  }

  async function handleSubmit(data) {
    try {
      await eventsApi.update(id, data);
      push('Event updated.', 'success');
      navigate('/admin/events');
    } catch (err) {
      push(err.message, 'error');
    }
  }

  return (
    <AdminShell
      title={event.title}
      subtitle="Edit details, then manage attendees, scanning, and analytics below."
      actions={
        <>
          <Badge status={event.status} />
          <Link to={`/events/${event.id}`} target="_blank" className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-dim)] hover:text-[var(--text)]">
            <ExternalLink size={14} /> Public page
          </Link>
        </>
      }
    >
      <EventShareLink eventId={event.id} />

      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <MiniStat label="Registered" value={`${stats.registered}/${event.capacity}`} />
        <MiniStat label="Checked in" value={stats.checkedIn} />
        <MiniStat label="Attendance" value={`${stats.attendanceRate}%`} />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <TabLink to={`/admin/events/${id}/attendees`} icon={Users} label="Attendees" />
        <TabLink to={`/admin/events/${id}/scanner`} icon={ScanLine} label="Scanner" />
        <TabLink to={`/admin/events/${id}/analytics`} icon={BarChart3} label="Analytics" />
      </div>

      <EventForm initial={event} onSubmit={handleSubmit} submitLabel="Save changes" />
    </AdminShell>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border px-4 py-2.5" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
      <span className="text-[var(--text-dim)] mr-2">{label}</span>
      <span className="font-semibold text-[var(--text)]">{value}</span>
    </div>
  );
}
function TabLink({ to, icon: Icon, label }) {
  return (
    <NavLink to={to} className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg border" style={{ borderColor: 'var(--line-12)', color: 'var(--text-dim)' }}>
      <Icon size={14} /> {label}
    </NavLink>
  );
}
