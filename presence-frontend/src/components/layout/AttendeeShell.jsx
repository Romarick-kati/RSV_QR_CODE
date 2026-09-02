import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import PublicNav from './PublicNav';
import { useLanguage } from '../../lib/LanguageContext';

export default function AttendeeShell({ title, subtitle, actions, children }) {
  const { t } = useLanguage();
  const TABS = [
    { to: '/dashboard', label: t('tab_overview'), end: true },
    { to: '/my-events', label: t('tab_my_events') },
    { to: '/profile', label: t('tab_profile') },
    { to: '/settings', label: t('nav_settings') },
  ];
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <PublicNav />
      <div className="border-b" style={{ borderColor: 'var(--line-08)' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 pb-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start justify-between gap-4 flex-wrap mb-5"
          >
            <div className="min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text)] break-words">{title}</h1>
              {subtitle && <p className="text-sm text-[var(--text-dim)] mt-1">{subtitle}</p>}
            </div>
            {actions}
          </motion.div>
          <nav className="flex items-center gap-1 overflow-x-auto -mx-1 px-1">
            {TABS.map((tab) => (
              <NavLink key={tab.to} to={tab.to} end={tab.end} className="relative px-4 py-2.5 rounded-lg text-[15px] font-semibold whitespace-nowrap">
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="attendee-tab-active-pill"
                        className="absolute inset-0 rounded-lg"
                        style={{ background: 'var(--accent)' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 transition-colors" style={{ color: isActive ? '#0A0D18' : 'var(--text-dim)' }}>{tab.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8">{children}</main>
    </div>
  );
}
