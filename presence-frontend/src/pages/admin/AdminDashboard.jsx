import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { CalendarDays, Users, ScanLine, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import AdminShell from '../../components/layout/AdminShell';
import { useSEO } from '../../lib/useSEO';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import { adminApi, eventsApi } from '../../lib/api';
import { formatDateTime, formatDate } from '../../lib/utils';

export default function AdminDashboard() {
  useSEO('Organizer Console', undefined, { noindex: true });
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    function load({ silent } = {}) {
      Promise.all([adminApi.dashboard(), eventsApi.listAdmin(), adminApi.registrations()])
        .then(([d, e, r]) => {
          if (cancelled) return;
          setStats(d);
          setEvents(e.events);
          setRegs(r.registrations);
        })
        .finally(() => { if (!cancelled && !silent) setLoading(false); });
    }
    load();
    // Keep the console live — check-ins happening at any event's scanner
    // right now update the numbers here within a few seconds.
    const interval = setInterval(() => load({ silent: true }), 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const recentRegs = [...regs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const recentIns = regs.filter((r) => r.attendance).sort((a, b) => new Date(b.attendance.checkedInAt) - new Date(a.attendance.checkedInAt)).slice(0, 5);
  const flagship = events[0];
  const flagshipRegs = flagship ? regs.filter((r) => r.eventId === flagship.id) : [];
  const flagshipCheckedIn = flagshipRegs.filter((r) => r.attendance).length;
  const flagshipRate = flagshipRegs.length ? Math.round((flagshipCheckedIn / flagshipRegs.length) * 100) : 0;
  const pieData = flagship
    ? [{ name: 'Checked in', value: flagshipCheckedIn, color: '#22D3A6' }, { name: 'Not yet arrived', value: flagshipRegs.length - flagshipCheckedIn, color: '#8B7CF6' }]
    : [];

  const trendData = buildTrend(regs);

  if (loading) {
    return (
      <AdminShell title="Dashboard" subtitle="Live overview across all events.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-2xl skeleton" />)}
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Live overview across all events."
      actions={<Link to="/admin/events/create" className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: '#22D3A6', color: '#04140f' }}><Plus size={15} /> New event</Link>}
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total events" value={stats.totalEvents} icon={CalendarDays} accent="#22D3A6" />
        <StatCard label="Total registrations" value={stats.totalRegistrations.toLocaleString()} icon={Users} accent="#8B7CF6" />
        <StatCard label="Checked in" value={stats.totalCheckedIn.toLocaleString()} icon={ScanLine} accent="#F5A623" />
        <StatCard label="Attendance rate" value={stats.attendanceRate} suffix="%" icon={TrendingUp} accent="#FF5C77" />
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5 mb-6">
        <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display text-base font-semibold">Registration &amp; check-in trend</h3>
            <span className="text-xs text-[var(--text-dim)]">Last 7 days, all events</span>
          </div>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ left: -20, top: 10 }}>
                <defs>
                  <linearGradient id="reg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B7CF6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#8B7CF6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="chk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3A6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#22D3A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: '#8D93B2', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8D93B2', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--panel-2)', border: '1px solid var(--line-10)', borderRadius: 10, fontSize: 12 }} />
                <Area type="monotone" dataKey="registrations" stroke="#8B7CF6" fill="url(#reg)" strokeWidth={2} />
                <Area type="monotone" dataKey="checkins" stroke="#22D3A6" fill="url(#chk)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-2">
            <LegendDot color="#8B7CF6" label="Registrations" />
            <LegendDot color="#22D3A6" label="Check-ins" />
          </div>
        </div>

        <div className="rounded-2xl border p-6 flex flex-col" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
          <h3 className="font-display text-base font-semibold mb-1">Flagship event</h3>
          <p className="text-xs text-[var(--text-dim)] mb-4">{flagship?.title || 'No events yet'}</p>
          {flagship && (
            <>
              <div className="h-44 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={52} outerRadius={72} paddingAngle={3} stroke="none">
                      {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-2xl font-semibold">{flagshipRate}%</span>
                  <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-wide">Attendance</span>
                </div>
              </div>
              <div className="flex justify-center gap-5 mt-3 mb-4">
                <LegendDot color="#22D3A6" label={`Checked in (${flagshipCheckedIn})`} />
                <LegendDot color="#8B7CF6" label={`Pending (${flagshipRegs.length - flagshipCheckedIn})`} />
              </div>
              <Link to={`/admin/events/${flagship.id}/analytics`} className="mt-auto text-sm font-semibold flex items-center justify-center gap-1.5 py-2.5 rounded-lg" style={{ background: 'rgba(34,211,166,0.12)', color: '#22D3A6' }}>
                Full analytics <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Panel title="Recent registrations" viewAllTo="/admin/reports">
          {recentRegs.length === 0 ? <p className="text-sm text-[var(--text-dim)] py-6 text-center">No registrations yet.</p> : recentRegs.map((r) => (
            <Row key={r.id} primary={r.user?.name} secondary={r.event?.title} meta={formatDateTime(r.createdAt)} />
          ))}
        </Panel>
        <Panel title="Recent check-ins" viewAllTo="/admin/reports">
          {recentIns.length === 0 ? (
            <p className="text-sm text-[var(--text-dim)] py-6 text-center">No check-ins recorded yet.</p>
          ) : recentIns.map((r) => (
            <Row key={r.id} primary={r.user?.name} secondary={r.event?.title} meta={formatDateTime(r.attendance.checkedInAt)} badge="checked-in" />
          ))}
        </Panel>
      </div>

      <h3 className="font-display text-base font-semibold mt-8 mb-4">Event performance</h3>
      <div className="rounded-2xl border overflow-hidden overflow-x-auto" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--text-dim)]" style={{ background: 'var(--line-03)' }}>
              <th className="px-5 py-3 font-semibold">Event</th>
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Registered</th>
              <th className="px-5 py-3 font-semibold">Checked in</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t" style={{ borderColor: 'var(--line-06)' }}>
                <td className="px-5 py-3.5 font-medium text-[var(--text)] max-w-[220px] truncate">{e.title}</td>
                <td className="px-5 py-3.5 text-[var(--text-dim)]">{formatDate(e.date)}</td>
                <td className="px-5 py-3.5"><Badge status={e.status} /></td>
                <td className="px-5 py-3.5 text-[var(--text-dim)]">{e.registered}</td>
                <td className="px-5 py-3.5 text-[var(--text-dim)]">{e.checkedIn}</td>
                <td className="px-5 py-3.5 text-right"><Link to={`/admin/events/${e.id}`} className="text-[#22D3A6] font-semibold">Manage</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function buildTrend(regs) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days.map((day) => ({
    day: new Date(day + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    registrations: regs.filter((r) => r.createdAt?.slice(0, 10) === day).length,
    checkins: regs.filter((r) => r.attendance?.checkedInAt?.slice(0, 10) === day).length,
  }));
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-[var(--text-dim)]">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}
function Panel({ title, viewAllTo, children }) {
  return (
    <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        <Link to={viewAllTo} className="text-xs font-semibold" style={{ color: '#22D3A6' }}>View all</Link>
      </div>
      <div className="flex flex-col divide-y" style={{ borderColor: 'var(--line-06)' }}>{children}</div>
    </div>
  );
}
function Row({ primary, secondary, meta, badge }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--text)] truncate">{primary}</p>
        <p className="text-xs text-[var(--text-dim)] truncate">{secondary}</p>
      </div>
      <div className="text-right shrink-0">
        {badge && <Badge status={badge} />}
        <p className="text-[11px] text-[var(--text-dim)] mt-1">{meta}</p>
      </div>
    </div>
  );
}
