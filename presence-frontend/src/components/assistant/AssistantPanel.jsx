import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, Trash2, MapPin, CalendarDays, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import EventMap from '../ui/EventMap';
import { formatDate } from '../../lib/utils';
import { useAssistant } from '../../lib/AssistantContext';
import { useLanguage } from '../../lib/LanguageContext';
import AssistantSparkle from './AssistantSparkle';

// One event found by the assistant: title/date/venue, a link to the event,
// and (for in-person or hybrid events) a tap-to-open map of the venue.
function AssistantEventCard({ ev, onNavigate }) {
  const [showMap, setShowMap] = useState(false);
  const hasVenue = ev.format !== 'online' && ev.venue;
  return (
    <div className="rounded-xl border p-3 text-xs" style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }}>
      <Link to={`/events/${ev.id}`} onClick={onNavigate} className="font-semibold text-sm text-[var(--text)] hover:underline block leading-snug">{ev.title}</Link>
      <div className="flex items-center gap-1.5 mt-1.5 text-[var(--text-dim)]"><CalendarDays size={12} /> {formatDate(ev.date)}{ev.price > 0 ? ` · ${ev.price} FCFA` : ' · Free'}</div>
      <div className="flex items-center gap-1.5 mt-1 text-[var(--text-dim)]"><MapPin size={12} /> <span className="truncate">{ev.venue}</span></div>
      {hasVenue && (
        <button type="button" onClick={() => setShowMap((v) => !v)} className="mt-2 inline-flex items-center gap-1 font-semibold" style={{ color: '#22D3A6' }}>
          {showMap ? 'Hide map' : 'Show on map'} <ChevronDown size={13} style={{ transform: showMap ? 'rotate(180deg)' : 'none', transition: 'transform .18s' }} />
        </button>
      )}
      {showMap && <div className="mt-2"><EventMap venue={ev.venue} latitude={ev.latitude} longitude={ev.longitude} height={160} /></div>}
    </div>
  );
}

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
                  className="assistant-header-badge w-8 h-8 rounded-full flex items-center justify-center"
                >
                  <AssistantSparkle size={18} active={sending} />
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
                <div key={i} className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'self-end' : 'self-start'}`}
                  style={m.role === 'user'
                    ? { background: '#22D3A6', color: '#04140f' }
                    : { background: 'var(--line-06)', color: 'var(--text)' }}
                >
                  {m.error ? <span style={{ color: '#FF5C77' }}>{t('asst_error')}</span> : m.text}
                  {m.events?.length > 0 && (
                    <div className="flex flex-col gap-2 mt-3">
                      {m.events.map((ev) => <AssistantEventCard key={ev.id} ev={ev} onNavigate={close} />)}
                    </div>
                  )}
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
