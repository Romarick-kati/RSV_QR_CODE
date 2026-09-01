import { useState } from 'react';
import { Menu, X as XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from './AdminSidebar';
import NotificationBell from './NotificationBell';
import { useAuth } from '../../lib/AuthContext';

export default function AdminShell({ title, subtitle, actions, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-8 h-[72px] border-b backdrop-blur-md" style={{ borderColor: 'var(--line-08)', background: 'var(--bg-translucent)' }}>
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden text-[var(--text-dim)] shrink-0 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileOpen ? 'x' : 'menu'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex"
                >
                  {mobileOpen ? <XIcon size={22} /> : <Menu size={22} />}
                </motion.span>
              </AnimatePresence>
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-lg sm:text-xl font-bold text-[var(--text)] truncate">{title}</h1>
              {subtitle && <p className="text-[13px] text-[var(--text-dim)] truncate mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {actions && <div className="flex items-center gap-2 overflow-x-auto max-w-[45vw] sm:max-w-none">{actions}</div>}
            {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && <NotificationBell />}
          </div>
        </header>
        <main className="px-4 sm:px-8 py-7 max-w-[1400px]">{children}</main>
      </div>
    </div>
  );
}
