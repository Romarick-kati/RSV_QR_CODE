import { AnimatePresence, motion } from 'framer-motion';

export default function ConfirmModal({ open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = true, busy = false, onConfirm, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => !busy && onClose()}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border p-6"
            style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }}
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="font-display text-lg font-semibold mb-2 text-[var(--text)]">{title}</h3>
            {description && <p className="text-sm text-[var(--text-dim)] mb-5">{description}</p>}
            <div className="flex gap-2">
              <button disabled={busy} onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-semibold border disabled:opacity-60 text-[var(--text)]" style={{ borderColor: 'var(--line-14)' }}>
                {cancelLabel}
              </button>
              <button
                disabled={busy}
                onClick={onConfirm}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
                style={danger ? { background: '#FF5C77', color: '#2b0510' } : { background: '#22D3A6', color: '#04140f' }}
              >
                {busy ? '…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
