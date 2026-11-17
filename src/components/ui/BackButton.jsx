import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';

// Root screens have nowhere sensible to go "back" to, so no button there.
const ROOTS = new Set(['/', '/dashboard', '/admin']);

export default function BackButton({ className = '' }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  if (ROOTS.has(pathname)) return null;

  const home = user ? (user.role === 'ADMIN' || user.role === 'ORGANIZER' ? '/admin' : '/dashboard') : '/';
  function goBack() {
    // React Router stores the position in this stack as history.state.idx.
    // idx > 0 means there is a previous in-app page; otherwise (someone
    // opened a shared link directly) fall back to home instead of leaving
    // the site or doing nothing.
    if (window.history.state && window.history.state.idx > 0) navigate(-1);
    else navigate(home, { replace: true });
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Go back"
      title="Go back"
      className={`shrink-0 w-9 h-9 rounded-full border flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/5 transition-colors ${className}`}
      style={{ borderColor: 'var(--line-12)' }}
    >
      <ArrowLeft size={17} />
    </button>
  );
}
