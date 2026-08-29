import { Link } from 'react-router-dom';
import { CompassIcon } from 'lucide-react';
import PublicNav from '../../components/layout/PublicNav';
import { useSEO } from '../../lib/useSEO';

export default function NotFound() {
  useSEO('Page not found', undefined, { noindex: true });
  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-screen">
      <PublicNav />
      <div className="max-w-lg mx-auto px-5 py-28 text-center">
        <span className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--line-05)' }}>
          <CompassIcon size={24} className="text-[var(--text-dim)]" />
        </span>
        <h1 className="font-display text-2xl font-semibold mb-2">Page not found</h1>
        <p className="text-[var(--text-dim)] mb-7">The page you're looking for doesn't exist or may have moved.</p>
        <Link to="/" className="text-sm font-semibold px-5 py-2.5 rounded-lg inline-block" style={{ background: '#22D3A6', color: '#04140f' }}>Back to home</Link>
      </div>
    </div>
  );
}
