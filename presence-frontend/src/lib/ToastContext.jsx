import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
// Error and info stay fixed semantic colors (red = bad, purple = neutral),
// but "success" is the app's own brand color — it needs to track whichever
// accent the visitor picked in Settings → Appearance instead of being
// hardcoded to teal, or a success toast looks wrong/inconsistent as soon
// as someone picks any accent other than the default.
const COLORS = { success: 'var(--accent)', error: '#FF5C77', info: '#8B7CF6' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const dismiss = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 w-[92vw] max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md"
                style={{ background: 'var(--bg-translucent)', borderColor: 'var(--line-10)' }}
              >
                <Icon size={18} style={{ color: COLORS[t.type], flexShrink: 0, marginTop: 2 }} />
                <p className="text-sm text-[var(--text)] leading-snug flex-1">{t.message}</p>
                <button onClick={() => dismiss(t.id)} className="text-[var(--text-dim)] hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
