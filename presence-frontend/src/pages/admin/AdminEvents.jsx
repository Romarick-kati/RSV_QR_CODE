import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, CalendarX, Users, ScanLine, BarChart3, Pencil, Trash2 } from 'lucide-react';
import AdminShell from '../../components/layout/AdminShell';
import { useSEO } from '../../lib/useSEO';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { eventsApi } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { useToast } from '../../lib/ToastContext';
import { useLanguage } from '../../lib/LanguageContext';

const STATUS_FILTERS = ['All', 'published', 'draft', 'completed', 'cancelled'];

export default function AdminEvents() {
  const { t } = useLanguage();
  useSEO(t('tab_manage_events'), undefined, { noindex: true });
  const { push } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { load(); }, []);
  function load() {
    setLoading(true);
    eventsApi.listAdmin().then(({ events }) => setEvents(events)).finally(() => setLoading(false));
  }

  const filtered = useMemo(() => events.filter((e) => {
    const matchesQ = !q || e.title.toLowerCase().includes(q.toLowerCase());
    const matchesStatus = status === 'All' || e.status === status;
    return matchesQ && matchesStatus;
  }), [events, q, status]);

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await eventsApi.remove(id);
      setEvents((es) => es.filter((e) => e.id !== id));
      push('Event deleted.', 'success');
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  }

  return (
    <AdminShell
      title={t('admin_events')}
      subtitle={loading ? t('adm_events_loading') : `${events.length} ${events.length === 1 ? t('adm_events_singular') : t('adm_events_plural')}`}
      actions={<Link to="/admin/events/create" className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: '#22D3A6', color: '#04140f' }}><Plus size={15} /> {t('adm_dash_new_event')}</Link>}
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('adm_events_search_placeholder')} className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm text-[var(--text)] outline-none" style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }} />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatus(s)} className="text-[13px] font-medium capitalize px-3.5 py-1.5 rounded-full border shrink-0" style={status === s ? { background: '#22D3A6', color: '#04140f', borderColor: '#22D3A6' } : { color: 'var(--text-dim)', borderColor: 'var(--line-12)' }}>
              {s === 'All' ? t('adm_events_filter_all') : t(`badge_${s}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-2xl skeleton" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CalendarX} title={t('adm_events_empty_title')} description={t('adm_events_empty_desc')} action={<Link to="/admin/events/create" className="text-sm font-semibold px-4 py-2 rounded-lg inline-block" style={{ background: '#22D3A6', color: '#04140f' }}>{t('adm_events_create')}</Link>} />
      ) : (
        <div className="grid gap-3">
          {filtered.map((e) => (
            <div key={e.id} className="rounded-2xl border p-5 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Link to={`/admin/events/${e.id}`} className="font-display font-semibold text-[var(--text)] hover:text-[#22D3A6] transition-colors">{e.title}</Link>
                  <Badge status={e.status} />
                </div>
                <p className="text-xs text-[var(--text-dim)]">{formatDate(e.date)} &middot; {e.venue} &middot; {e.category}</p>
              </div>
              <div className="flex items-center gap-5 text-sm text-[var(--text-dim)] shrink-0">
                <span className="flex items-center gap-1.5"><Users size={14} /> {e.registered}/{e.capacity}</span>
                <span className="flex items-center gap-1.5"><ScanLine size={14} /> {e.checkedIn ?? 0}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <IconLink to={`/admin/events/${e.id}/analytics`} icon={BarChart3} label={t('adm_events_analytics')} />
                <IconLink to={`/admin/events/${e.id}/scanner`} icon={ScanLine} label={t('adm_events_scanner')} />
                <IconLink to={`/admin/events/${e.id}`} icon={Pencil} label={t('adm_events_edit')} />
                <button onClick={() => setConfirmId(e.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#FF5C77] hover:bg-white/5" title={t('action_delete')}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirmId}
        title={t('adm_events_delete_title')}
        description={t('adm_events_delete_desc')}
        confirmLabel={t('action_delete')}
        busy={deleting}
        onConfirm={() => handleDelete(confirmId)}
        onClose={() => setConfirmId(null)}
      />
    </AdminShell>
  );
}

function IconLink({ to, icon: Icon, label }) {
  return (
    <Link to={to} title={label} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-dim)] hover:text-[#22D3A6] hover:bg-white/5">
      <Icon size={15} />
    </Link>
  );
}
