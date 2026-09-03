import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from './api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'presence_session';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  // True while we revalidate a stored token against the server on first load.
  const [initializing, setInitializing] = useState(!!session);

  useEffect(() => {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  }, [session]);

  // On mount, if a token was persisted from a previous visit, confirm it's
  // still valid and refresh the user record rather than trusting stale
  // localStorage data indefinitely.
  useEffect(() => {
    let cancelled = false;
    async function revalidate() {
      if (!session?.token) { setInitializing(false); return; }
      try {
        const { user } = await authApi.me();
        if (!cancelled) setSession((s) => (s ? { ...s, user } : s));
      } catch {
        if (!cancelled) setSession(null);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }
    revalidate();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login({ email, password }) {
    const { user, token } = await authApi.login(email, password);
    const next = { user, token };
    setSession(next);
    return next;
  }

  async function register({ name, email, password }) {
    const { user, token } = await authApi.register(name, email, password);
    const next = { user, token };
    setSession(next);
    return next;
  }

  async function updateProfile(payload) {
    const { user } = await authApi.updateMe(payload);
    setSession((s) => (s ? { ...s, user } : s));
    return user;
  }

  // avatarUrl is a compressed base64 data URL, or null to remove the photo.
  async function updateAvatar(avatarUrl) {
    const { user } = await authApi.updateMe({ avatarUrl });
    setSession((s) => (s ? { ...s, user } : s));
    return user;
  }

  async function applyForOrganizer(payload) {
    const { user } = await authApi.requestOrganizerAccess(payload);
    setSession((s) => (s ? { ...s, user } : s));
    return user;
  }

  async function loginWithGoogle({ credential }) {
    const { user, token } = await authApi.google(credential);
    const next = { user, token };
    setSession(next);
    return next;
  }

  function logout() {
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ user: session?.user || null, token: session?.token || null, initializing, login, register, loginWithGoogle, logout, updateProfile, updateAvatar, applyForOrganizer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
