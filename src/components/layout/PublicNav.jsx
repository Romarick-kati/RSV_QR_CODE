import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, ChevronDown, LayoutDashboard, LogOut, ShieldCheck, Settings as SettingsIcon, CircleHelp, Plus } from 'lucide-react';
import BrandMark from '../ui/BrandMark';
import PreferencesToggle from '../ui/PreferencesToggle';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const LINKS = [
    { to: '/discover', label: t('nav_discover') },
    { to: '/events', label: t('nav_events') },
    { to: '/about', label: t('nav_about') },
    { to: '/faq', label: t('nav_faq') },
  ];

  // Closes the dropdown on an actual outside click, instead of the previous
  // onBlur+setTimeout approach — that raced against the click on "Sign
  // out"/"My dashboard" itself: blur fires the instant those buttons are
  // pressed, and if the browser was even slightly slow to register the
  // click before the timeout fired, the menu (and the button under the
  // cursor) vanished before the click completed, so sign-out silently did
  // nothing. Listening for a real click outside has no such race.
  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ background: 'var(--bg-translucent)', borderColor: 'var(--line-08)' }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.span
            whileHover={{ scale: 1.08, rotate: -4 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <BrandMark size={32} animated />
          </motion.span>
          <span className="font-display font-bold text-lg tracking-tight transition-colors group-hover:text-[var(--accent)]">Presence</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className="relative px-4 py-2.5 rounded-lg text-[15px] font-semibold">
              {({ isActive }) => (
                <>
                  <span className="relative z-10 transition-colors" style={{ color: isActive ? 'var(--text)' : 'var(--text-dim)' }}>{l.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-lg bg-white/5"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <PreferencesToggle />
          {user ? (
            <>
              {/* Any signed-in user can host, Luma-style — no approval gate
                  for a free event; only actually charging attendees (via
                  Campay) needs the organizer-vetting flow, checked
                  server-side when the event is saved. */}
              <Link
                to="/admin/events/create"
                className="hidden lg:flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg border hover:bg-white/5 transition-colors text-[var(--text)]"
                style={{ borderColor: 'var(--line-12)' }}
              >
                <Plus size={15} /> {t('nav_create_event')}
              </Link>
              <Link
                to="/settings"
                aria-label={t('nav_settings')}
                title={t('nav_settings')}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/5 transition-colors"
              >
                <SettingsIcon size={18} />
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'var(--line-10)' }}
                >
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', color: 'var(--accent-ink)' }}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
                    )}
                  </span>
                  <span className="text-sm font-medium text-[var(--text)] max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={14} className="text-[var(--text-dim)]" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border shadow-2xl overflow-hidden z-50" style={{ background: 'var(--panel)', borderColor: 'var(--line-10)' }}>
                    <Link to={user.role === 'ADMIN' || user.role === 'ORGANIZER' ? '/admin' : '/dashboard'} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--text)] hover:bg-white/5">
                      {user.role === 'ADMIN' || user.role === 'ORGANIZER' ? <ShieldCheck size={15} /> : <LayoutDashboard size={15} />}
                      {user.role === 'ADMIN' || user.role === 'ORGANIZER' ? t('nav_organizer_console') : t('nav_my_dashboard')}
                    </Link>
                    <Link to="/faq" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--text)] hover:bg-white/5 border-t" style={{ borderColor: 'var(--line-08)' }}>
                      <CircleHelp size={15} /> {t('nav_faq')}
                    </Link>
                    <button
                      onClick={() => { setMenuOpen(false); logout(); navigate('/'); }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#FF5C77] hover:bg-white/5 border-t"
                      style={{ borderColor: 'var(--line-08)' }}
                    >
                      <LogOut size={15} /> {t('nav_sign_out')}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-[var(--text-dim)] hover:text-[var(--text)] px-3 py-2 transition-colors">{t('nav_sign_in')}</Link>
              <Link
                to="/register"
                className="btn-pop text-sm font-semibold px-4 py-2 rounded-lg"
                style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', color: 'var(--accent-ink)' }}
              >
                {t('nav_get_started')}
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-[var(--text)]" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t px-5 py-4 flex flex-col gap-1" style={{ borderColor: 'var(--line-08)', background: 'var(--bg)' }}>
          <div className="flex items-center justify-between px-1 pb-3 mb-1 border-b" style={{ borderColor: 'var(--line-08)' }}>
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">Preferences</span>
            <PreferencesToggle />
          </div>
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text)] hover:bg-white/5">
              {l.label}
            </NavLink>
          ))}
          <div className="h-px my-2" style={{ background: 'var(--line-08)' }} />
          {user ? (
            <>
              <Link to={user.role === 'ADMIN' || user.role === 'ORGANIZER' ? '/admin' : '/dashboard'} onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text)] hover:bg-white/5">
                {user.role === 'ADMIN' || user.role === 'ORGANIZER' ? t('nav_organizer_console') : t('nav_my_dashboard')}
              </Link>
              <Link to="/admin/events/create" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text)] hover:bg-white/5">
                <Plus size={15} /> {t('nav_create_event')}
              </Link>
              <Link to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text)] hover:bg-white/5">
                <SettingsIcon size={15} /> {t('nav_settings')}
              </Link>
              <button onClick={() => { logout(); navigate('/'); setOpen(false); }} className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#FF5C77] hover:bg-white/5">
                {t('nav_sign_out')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text)] hover:bg-white/5">{t('nav_sign_in')}</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg text-sm font-semibold text-center mt-1" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', color: 'var(--accent-ink)' }}>
                {t('nav_get_started')}
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
