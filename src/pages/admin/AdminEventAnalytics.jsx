import { useEffect, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, Users, ScanLine, Percent, Gauge } from 'lucide-react';
import AdminShell from '../../components/layout/AdminShell';
import { useSEO } from '../../lib/useSEO';
import StatCard from '../../components/ui/StatCard';
import { eventsApi } from '../../lib/api';
import { useLanguage } from '../../lib/LanguageContext';

export default function AdminEventAnalytics() {
  const { t } = useLanguage();
  useSEO(t('tab_event_analytics'), undefined, { noindex: true });
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([eventsApi.get(id), eventsApi.statistics(id), eventsApi.attendees(id)])
      .then(([e, s, a]) => {
        setEvent(e.event);
        setStats(s);
        setTrend(buildTrend(a.attendees));
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <Navigate to="/admin/events" replace />;
  if (!event || !stats) {
    return (
      <AdminShell title={t('adm_events_analytics')} subtitle={t('adm_events_loading')}>
        <div className="h-72 rounded-2xl skeleton" />
      </AdminShell>
    );
  }

  const pieData = [
    { key: 'checkedIn', name: t('adm_dash_th_checked_in'), value: stats.checkedIn, color: '#22D3A6' },
    { key: 'notCheckedIn', name: t('adm_att_filter_not_checked_in'), value: stats.notCheckedIn, color: '#8B7CF6' },
    { key: 'remainingCapacity', name: t('adm_analytics_pie_remaining_capacity'), value: Math.max(stats.capacity - stats.registered, 0), color: 'var(--line-08)' },
  ];

  return (
    <AdminShell
      title={t('adm_events_analytics')}
      subtitle={event.title}
      actions={<Link to={`/admin/events/${id}`} className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-dim)] hover:text-[var(--text)]"><ArrowLeft size={15} /> {t('adm_att_back_to_event')}</Link>}
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('adm_dash_th_registered')} value={stats.registered} icon={Users} accent="#8B7CF6" />
        <StatCard label={t('adm_dash_th_checked_in')} value={stats.checkedIn} icon={ScanLine} accent="#22D3A6" />
        <StatCard label={t('adm_dash_stat_attendance_rate')} value={stats.attendanceRate} suffix="%" icon={Percent} accent="#F5A623" />
        <StatCard label={t('adm_analytics_capacity_utilization')} value={stats.capacityUtilization} suffix="%" icon={Gauge} accent="#FF5C77" />
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5">
        <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
          <h3 className="font-display text-base font-semibold mb-4">{t('adm_analytics_reg_over_time')}</h3>
          <div className="h-64">
            {trend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-[var(--text-dim)]">{t('adm_analytics_no_activity')}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ left: -20, top: 10 }}>
                  <XAxis dataKey="day" tick={{ fill: '#8D93B2', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#8D93B2', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--panel-2)', border: '1px solid var(--line-10)', borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="registrations" fill="#8B7CF6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
          <h3 className="font-display text-base font-semibold mb-4">{t('adm_analytics_capacity_breakdown')}</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={54} outerRadius={78} paddingAngle={2} stroke="none">
                  {pieData.map((d) => <Cell key={d.key} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--panel-2)', border: '1px solid var(--line-10)', borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            {pieData.map((d) => (
              <div key={d.key} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-[var(--text-dim)]"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} /> {d.name}</span>
                <span className="font-medium text-[var(--text)]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function buildTrend(attendees) {
  const byDay = {};
  attendees.forEach((a) => {
    const day = a.createdAt?.slice(0, 10);
    if (!day) return;
    byDay[day] = (byDay[day] || 0) + 1;
  });
  return Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, count]) => ({ day: day.slice(5), registrations: count }));
}
