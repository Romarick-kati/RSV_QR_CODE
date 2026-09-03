import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, UserPlus, Check } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';

const ICONS = {
  user_registered: UserPlus,
};

// Polling rather than a websocket/SSE connection — simplest thing that
// works reliably on a Netlify Function backend (which doesn't hold a
// persistent connection open between requests anyway), at a frequency
// that won't feel stale to an admin keeping this tab open.
const POLL_MS = 30000;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    function load() {
      adminApi.notifications()
        .then(({ notifications: list, unreadCount: count }) => {
          if (cancelled) return;
          setNotifications(list);
          setUnreadCount(count);
        })
        .catch(() => {}); // silent — a failed poll shouldn't interrupt the admin's work
    }
    load();
    const id = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function markRead(id) {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, _readLocally: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try { await adminApi.markNotificationRead(id); } catch { /* next poll will reconcile */ }
  }

  async function markAllRead() {
    setNotifications((list) => list.map((n) => ({ ...n, _readLocally: true })));
    setUnreadCount(0);
    try { await adminApi.markAllNotificationsRead(); } catch { /* next poll will reconcile */ }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/5 transition-colors"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold"
            style={{ background: '#FF5C77', color: '#2b0510' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            // Fixed on mobile so it can't overflow the viewport on a narrow
            // screen; anchored under the bell on larger ones.
            className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 sm:w-80 rounded-2xl border shadow-xl z-50 overflow-hidden"
            style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--line-08)' }}>
              <span className="font-semibold text-sm text-[var(--text)]">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs font-semibold flex items-center gap-1" style={{ color: '#22D3A6' }}>
                  <Check size={12} /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-[var(--text-dim)] text-center py-8 px-4">No notifications yet — you'll see new user signups here.</p>
              ) : (
                notifications.map((n) => {
                  const Icon = ICONS[n.type] || Bell;
                  const isUnread = !n._readLocally && !n.readByMe;
                  return (
                    <button
                      key={n.id}
                      onClick={() => isUnread && markRead(n.id)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left border-b last:border-b-0 hover:bg-white/5 transition-colors"
                      style={{ borderColor: 'var(--line-06)' }}
                    >
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: isUnread ? 'rgba(34,211,166,0.14)' : 'var(--line-05)', color: isUnread ? '#22D3A6' : 'var(--text-dim)' }}
                      >
                        <Icon size={15} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-[var(--text)] leading-snug">{n.message}</p>
                        <p className="text-[11px] text-[var(--text-dim)] mt-0.5">{formatDateTime(n.createdAt)}</p>
                      </div>
                      {isUnread && <span className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: '#22D3A6' }} />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
