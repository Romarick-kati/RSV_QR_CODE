import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, Trash2 } from 'lucide-react';
import { useAssistant } from '../../lib/AssistantContext';
import { useLanguage } from '../../lib/LanguageContext';
import AssistantSparkle from './AssistantSparkle';

export default function AssistantPanel() {
  const { isOpen, close, messages, sending, send, clearConversation } = useAssistant();
  const { t } = useLanguage();
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, sending]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    send(draft);
    setDraft('');
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop on mobile only — on desktop the panel is a corner
              widget, not a takeover, so nothing should block the page
              behind it. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed z-50 inset-x-3 bottom-3 top-16 sm:inset-x-auto sm:top-auto sm:bottom-5 sm:right-5 sm:w-96 sm:h-[560px] rounded-2xl border shadow-2xl flex flex-col overflow-hidden"
            style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--line-08)' }}>
              <div className="flex items-center gap-2">
                <span
                  className="assistant-header-badge w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(34,211,166,0.16), rgba(139,124,246,0.16))' }}
                >
                  <AssistantSparkle size={15} active={sending} />
                </span>
                <span className="font-display font-semibold text-sm text-[var(--text)]">{t('asst_title')}</span>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={() => { if (window.confirm('Clear this conversation? This can\'t be undone.')) clearConversation(); }}
                    title="Clear conversation"
                    aria-label="Clear conversation"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-dim)] hover:text-[#FF5C77] hover:bg-white/5"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button onClick={close} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/5">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {messages.length === 0 && (
                <div className="text-sm text-[var(--text-dim)] leading-relaxed">
                  {t('asst_greeting')}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'self-end' : 'self-start'}`}
                  style={m.role === 'user'
                    ? { background: '#22D3A6', color: '#04140f' }
                    : { background: 'var(--line-06)', color: 'var(--text)' }}
                >
                  {m.error ? <span style={{ color: '#FF5C77' }}>{t('asst_error')}</span> : m.text}
                </div>
              ))}
              {sending && (
                <div className="self-start rounded-xl px-3.5 py-2.5 text-sm flex gap-1.5" style={{ background: 'var(--line-06)' }}>
                  <span className="assistant-dot" style={{ animationDelay: '0ms' }} />
                  <span className="assistant-dot" style={{ animationDelay: '160ms' }} />
                  <span className="assistant-dot" style={{ animationDelay: '320ms' }} />
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 border-t shrink-0" style={{ borderColor: 'var(--line-08)' }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t('asst_placeholder')}
                className="flex-1 bg-transparent text-sm outline-none text-[var(--text)] placeholder:text-[var(--text-dim)]"
                autoFocus
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40"
                style={{ background: '#22D3A6', color: '#04140f' }}
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
