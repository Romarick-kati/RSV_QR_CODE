import { useLanguage } from '../../lib/LanguageContext';

const VARIANTS = {
  published: { bg: 'rgba(34,211,166,0.14)', fg: '#22D3A6', key: 'badge_published' },
  draft: { bg: 'var(--line-08)', fg: 'var(--text-dim)', key: 'badge_draft' },
  cancelled: { bg: 'rgba(255,92,119,0.14)', fg: '#FF5C77', key: 'badge_cancelled' },
  completed: { bg: 'rgba(139,124,246,0.14)', fg: '#8B7CF6', key: 'badge_completed' },
  confirmed: { bg: 'rgba(34,211,166,0.14)', fg: '#22D3A6', key: 'badge_confirmed' },
  'checked-in': { bg: 'rgba(34,211,166,0.14)', fg: '#22D3A6', key: 'badge_checked_in' },
  pending: { bg: 'rgba(245,166,35,0.14)', fg: '#F5A623', key: 'badge_pending' },
  waitlisted: { bg: 'rgba(139,124,246,0.14)', fg: '#8B7CF6', key: 'badge_waitlisted' },
};

export default function Badge({ status, children }) {
  const { t } = useLanguage();
  const v = VARIANTS[status] || { bg: 'var(--line-08)', fg: 'var(--text-dim)', key: null };
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full"
      style={{ background: v.bg, color: v.fg }}
    >
      {children || (v.key ? t(v.key) : status)}
    </span>
  );
}
