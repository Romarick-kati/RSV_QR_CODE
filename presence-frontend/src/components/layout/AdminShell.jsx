import { useState } from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

export default function AdminShell({ title, subtitle, actions, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-8 h-16 border-b backdrop-blur-md" style={{ borderColor: 'var(--line-08)', background: 'var(--bg-translucent)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMobileOpen(true)} className="md:hidden text-[var(--text-dim)] shrink-0"><Menu size={20} /></button>
            <div className="min-w-0">
              <h1 className="font-display text-base sm:text-lg font-semibold text-[var(--text)] truncate">{title}</h1>
              {subtitle && <p className="text-xs text-[var(--text-dim)] truncate">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0 overflow-x-auto max-w-[55vw] sm:max-w-none">{actions}</div>}
        </header>
        <main className="px-4 sm:px-8 py-7 max-w-[1400px]">{children}</main>
      </div>
    </div>
  );
}
