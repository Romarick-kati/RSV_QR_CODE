import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, FileBarChart, Users, LogOut, X, Globe, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BrandMark from '../ui/BrandMark';
import PreferencesToggle from '../ui/PreferencesToggle';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';

export default function AdminSidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // A self-serve ATTENDEE who created their own event gets a trimmed-down
  // sidebar — just their event, not the full organizer console (dashboard
  // totals, cross-event reports, and user management are scoped to
  // ADMIN/ORGANIZER and would otherwise be dead links for them here).
  const isSelfServeHost = user?.role === 'ATTENDEE';
  const LINKS = isSelfServeHost
    ? []
    : [
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
      <div className="flex items-center justify-between px-5 h-[72px] border-b" style={{ borderColor: 'var(--line-08)' }}>
        <Link to="/admin" className="flex items-center gap-2.5 group">
          <motion.span whileHover={{ scale: 1.08, rotate: -4 }} whileTap={{ scale: 0.94 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
            <BrandMark size={32} animated />
          </motion.span>
          <span className="font-display font-bold text-lg transition-colors group-hover:text-[var(--accent)]">Presence</span>
        </Link>
        <button onClick={onClose} className="md:hidden text-[var(--text-dim)]"><X size={22} /></button>
      </div>

      <nav className="flex-1 px-3 py-5 flex flex-col gap-1.5">
        <span className="px-3.5 text-[11px] uppercase tracking-wide text-[var(--text-dim)] font-bold mb-1.5">{isSelfServeHost ? 'Your event' : t('nav_organizer_console')}</span>
        {LINKS.map((l, i) => (
          <motion.div
            key={l.to}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <NavLink
              to={l.to}
              end={l.end}
              onClick={onClose}
              className="relative flex items-center gap-3 px-3.5 py-3 rounded-lg text-[15px] font-semibold"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="admin-nav-active-pill"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'rgba(var(--accent-rgb),0.12)' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-3 transition-colors" style={{ color: isActive ? 'var(--accent)' : 'var(--text-dim)' }}>
                    <l.icon size={18} /> {l.label}
                  </span>
                </>
              )}
            </NavLink>
          </motion.div>
        ))}

        <div className="mt-6 px-3.5 text-[11px] uppercase tracking-wide text-[var(--text-dim)] font-bold mb-1.5">Shortcuts</div>
        {isSelfServeHost && (
          <Link to="/dashboard" className="hover-lift flex items-center gap-3 px-3.5 py-3 rounded-lg text-[15px] font-semibold text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/5">
            <LayoutDashboard size={18} /> {t('nav_my_dashboard')}
          </Link>
        )}
        <Link to="/events" className="hover-lift flex items-center gap-3 px-3.5 py-3 rounded-lg text-[15px] font-semibold text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/5">
          <Globe size={18} /> {t('nav_view_public_site')}
        </Link>
        <Link to="/settings" className="hover-lift flex items-center gap-3 px-3.5 py-3 rounded-lg text-[15px] font-semibold text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/5">
          <SettingsIcon size={18} /> {t('nav_settings')}
        </Link>
      </nav>

      <div className="p-3 border-t" style={{ borderColor: 'var(--line-08)' }}>
        <div className="flex justify-center mb-3">
          <PreferencesToggle />
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1" style={{ background: 'var(--line-04)' }}>
          <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg,#F5A623,#FF5C77)', color: 'var(--accent-ink)' }}>
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
          className="hover-lift w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#FF5C77] hover:bg-white/5"
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
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial="closed"
            animate="open"
            exit="closed"
          >
            <motion.div
              className="absolute inset-0 bg-black/60"
              variants={{ open: { opacity: 1 }, closed: { opacity: 0 } }}
              transition={{ duration: 0.25 }}
              onClick={onClose}
            />
            <motion.aside
              className="absolute top-0 bottom-0 left-0 w-72 border-r"
              style={{ borderColor: 'var(--line-08)', background: 'var(--panel-2)' }}
              variants={{ open: { x: 0 }, closed: { x: '-100%' } }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            >
              {content}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
