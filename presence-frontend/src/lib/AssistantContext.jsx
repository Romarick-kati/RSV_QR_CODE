import { createContext, useCallback, useContext, useState } from 'react';
import { assistantApi } from './api';

const AssistantContext = createContext(null);

// One shared conversation for the whole session, so opening the assistant
// from the public nav, then later from the admin console, continues the
// same conversation instead of starting over. `apiHistory` is the raw
// tool-use-shaped history the backend hands back each turn — opaque to
// this file, just echoed back on the next call (see utils/assistant.js on
// the server for what's actually in it).
export function AssistantProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]); // [{ role: 'user'|'assistant', text }]
  const [apiHistory, setApiHistory] = useState([]);
  const [sending, setSending] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  // Resets both the visible messages AND apiHistory — clearing just the
  // display would leave old turns silently still influencing the AI's
  // replies, since apiHistory is what actually gets sent back to it.
  const clearConversation = useCallback(() => {
    setMessages([]);
    setApiHistory([]);
  }, []);

  const send = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setMessages((m) => [...m, { role: 'user', text: trimmed }]);
    setSending(true);
    try {
      const { reply, history } = await assistantApi.chat(trimmed, apiHistory);
      setApiHistory(history || []);
      setMessages((m) => [...m, { role: 'assistant', text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: null, error: true }]);
    } finally {
      setSending(false);
    }
  }, [apiHistory, sending]);

  return (
    <AssistantContext.Provider value={{ isOpen, open, close, messages, sending, send, clearConversation }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error('useAssistant must be used within AssistantProvider');
  return ctx;
}
