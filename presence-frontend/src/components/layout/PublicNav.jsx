import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import BrandMark from '../ui/BrandMark';
import PreferencesToggle from '../ui/PreferencesToggle';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const LINKS = [
    { to: '/events', label: t('nav_events') },
    { to: '/about', label: t('nav_about') },
    { to: '/faq', label: t('nav_faq') },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ background: 'var(--bg-translucent)', borderColor: 'var(--line-08)' }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandMark size={32} />
          <span className="font-display font-bold text-lg tracking-tight">Presence</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-[var(--text)] bg-white/5' : 'text-[var(--text-dim)] hover:text-[var(--text)]'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <PreferencesToggle />
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border hover:bg-white/5 transition-colors"
                style={{ borderColor: 'var(--line-10)' }}
              >
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden" style={{ background: 'linear-gradient(135deg,#22D3A6,#8B7CF6)', color: '#04140f' }}>
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
                <div className="absolute right-0 mt-2 w-52 rounded-xl border shadow-2xl overflow-hidden" style={{ background: 'var(--panel)', borderColor: 'var(--line-10)' }}>
                  <Link to={user.role === 'ADMIN' || user.role === 'ORGANIZER' ? '/admin' : '/dashboard'} className="flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--text)] hover:bg-white/5">
                    {user.role === 'ADMIN' || user.role === 'ORGANIZER' ? <ShieldCheck size={15} /> : <LayoutDashboard size={15} />}
                    {user.role === 'ADMIN' || user.role === 'ORGANIZER' ? t('nav_organizer_console') : t('nav_my_dashboard')}
                  </Link>
                  <button
                    onClick={() => { logout(); navigate('/'); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#FF5C77] hover:bg-white/5 border-t"
                    style={{ borderColor: 'var(--line-08)' }}
                  >
                    <LogOut size={15} /> {t('nav_sign_out')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-[var(--text-dim)] hover:text-[var(--text)] px-3 py-2 transition-colors">{t('nav_sign_in')}</Link>
              <Link
                to="/register"
                className="text-sm font-semibold px-4 py-2 rounded-lg transition-transform hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#22D3A6,#8B7CF6)', color: '#04140f' }}
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
              <button onClick={() => { logout(); navigate('/'); setOpen(false); }} className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#FF5C77] hover:bg-white/5">
                {t('nav_sign_out')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text)] hover:bg-white/5">{t('nav_sign_in')}</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg text-sm font-semibold text-center mt-1" style={{ background: 'linear-gradient(135deg,#22D3A6,#8B7CF6)', color: '#04140f' }}>
                {t('nav_get_started')}
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
