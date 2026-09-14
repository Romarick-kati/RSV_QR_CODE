import { useEffect, useRef } from 'react';

// A handful of admin screens poll the server every few seconds so numbers
// stay live while the page is open (see AdminDashboard, AdminScanner,
// AdminEventDetail, AdminEventAttendees). Left as a raw setInterval, that
// polling keeps firing at full speed even if the tab is minimized, the
// phone is locked, or the organizer switched to another app — burning
// data and battery for a screen nobody is looking at. This hook pauses the
// interval entirely while the page isn't visible, and re-fires `callback`
// immediately on return so the numbers catch up right away instead of
// waiting a full interval.
//
// `enabled` lets a caller turn polling off entirely (e.g. only poll while
// a payment is still pending) without restructuring the effect.
export function useVisibilityPolling(callback, ms, enabled = true) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;
    let id = null;

    function start() {
      if (id) return;
      id = setInterval(() => callbackRef.current(), ms);
    }
    function stop() {
      if (id) { clearInterval(id); id = null; }
    }
    function handleVisibility() {
      if (document.hidden) {
        stop();
      } else {
        callbackRef.current(); // catch up immediately on return
        start();
      }
    }

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [ms, enabled]);
}
