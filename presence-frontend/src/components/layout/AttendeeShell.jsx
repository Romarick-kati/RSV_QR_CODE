import { NavLink } from 'react-router-dom';
import PublicNav from './PublicNav';
import { useLanguage } from '../../lib/LanguageContext';

export default function AttendeeShell({ title, subtitle, actions, children }) {
  const { t } = useLanguage();
  const TABS = [
    { to: '/dashboard', label: t('tab_overview'), end: true },
    { to: '/my-events', label: t('tab_my_events') },
    { to: '/profile', label: t('tab_profile') },
  ];
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <PublicNav />
      <div className="border-b" style={{ borderColor: 'var(--line-08)' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 pb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
            <div className="min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text)] break-words">{title}</h1>
              {subtitle && <p className="text-sm text-[var(--text-dim)] mt-1">{subtitle}</p>}
            </div>
            {actions}
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto -mx-1 px-1">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'text-[#0A0D18]' : 'text-[var(--text-dim)] hover:text-[var(--text)]'}`
                }
                style={({ isActive }) => (isActive ? { background: '#22D3A6' } : {})}
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8">{children}</main>
    </div>
  );
}
