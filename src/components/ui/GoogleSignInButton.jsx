import { useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
let scriptPromise = null;

function loadGoogleScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In.'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// Renders Google's own branded button (required by Google's terms — we
// don't draw a custom "Sign in with Google" button ourselves) and forwards
// the signed credential up to onCredential. Silently renders nothing if no
// client ID is configured, so the rest of the login page degrades cleanly.
export default function GoogleSignInButton({ onCredential, onError }) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => onCredential(response.credential),
        });
        // Google draws the button at a fixed pixel width, so measure the
        // space the card actually gives it (200-400px is Google's allowed
        // range). A hard-coded 320 spilled out of the card on narrow layouts.
        const available = Math.floor(containerRef.current.parentElement?.clientWidth || 280);
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          width: Math.max(200, Math.min(400, available)),
          text: 'continue_with',
          logo_alignment: 'center',
        });
        setReady(true);
      })
      .catch((err) => onError?.(err.message));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="w-full flex justify-center overflow-hidden">
      <div ref={containerRef} style={{ minHeight: ready ? undefined : 44 }} />
    </div>
  );
}
