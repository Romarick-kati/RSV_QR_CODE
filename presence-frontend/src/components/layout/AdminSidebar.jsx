import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, FileBarChart, Users, LogOut, X, Globe } from 'lucide-react';
import BrandMark from '../ui/BrandMark';
import PreferencesToggle from '../ui/PreferencesToggle';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';

export default function AdminSidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const LINKS = [
    { to: '/admin', label: t('admin_dashboard'), icon: LayoutDashboard, end: true },
    { to: '/admin/events', label: t('admin_events'), icon: CalendarDays },
    { to: '/admin/reports', label: t('admin_reports'), icon: FileBarChart },
    // User management touches accounts and roles directly, so it's kept to
    // ADMIN only — an organizer managing events shouldn't also be able to
    // change who has admin access.
    ...(user?.role === 'ADMIN' ? [{ to: '/admin/users', label: t('admin_users'), icon: Users }] : []),
  ];

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 h-16 border-b" style={{ borderColor: 'var(--line-08)' }}>
        <Link to="/admin" className="flex items-center gap-2.5">
          <BrandMark size={30} />
          <span className="font-display font-bold text-base">Presence</span>
        </Link>
        <button onClick={onClose} className="md:hidden text-[var(--text-dim)]"><X size={20} /></button>
      </div>

      <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
        <span className="px-3 text-[11px] uppercase tracking-wide text-[var(--text-dim)] font-semibold mb-1.5">{t('nav_organizer_console')}</span>
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'text-[var(--text)]' : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/5'
              }`
            }
            style={({ isActive }) => (isActive ? { background: 'rgba(34,211,166,0.12)', color: '#22D3A6' } : {})}
          >
            <l.icon size={17} /> {l.label}
          </NavLink>
        ))}

        <div className="mt-6 px-3 text-[11px] uppercase tracking-wide text-[var(--text-dim)] font-semibold mb-1.5">Shortcuts</div>
        <Link to="/events" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/5">
          <Globe size={17} /> {t('nav_view_public_site')}
        </Link>
      </nav>

      <div className="p-3 border-t" style={{ borderColor: 'var(--line-08)' }}>
        <div className="flex justify-center mb-3">
          <PreferencesToggle />
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1" style={{ background: 'var(--line-04)' }}>
          <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg,#F5A623,#FF5C77)', color: '#04140f' }}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('')
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text)] truncate">{user?.name}</p>
            <p className="text-[11px] text-[var(--text-dim)] truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#FF5C77] hover:bg-white/5"
        >
          <LogOut size={17} /> {t('nav_sign_out')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex md:w-64 shrink-0 border-r fixed top-0 bottom-0 left-0 z-30" style={{ borderColor: 'var(--line-08)', background: 'var(--panel-2)' }}>
        {content}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <aside className="absolute top-0 bottom-0 left-0 w-72 border-r" style={{ borderColor: 'var(--line-08)', background: 'var(--panel-2)' }}>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
