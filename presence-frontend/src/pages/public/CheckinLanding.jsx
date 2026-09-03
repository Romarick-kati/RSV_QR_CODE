import { Link, useParams } from 'react-router-dom';
import { ScanLine, ShieldCheck, LogIn } from 'lucide-react';
import PublicNav from '../../components/layout/PublicNav';
import PublicFooter from '../../components/layout/PublicFooter';
import BrandMark from '../../components/ui/BrandMark';
import { useAuth } from '../../lib/AuthContext';
import { useSEO } from '../../lib/useSEO';

// Reached when someone scans a Presence QR pass with an ordinary phone
// camera app instead of the organizer's in-app scanner. It deliberately
// does NOT look up or display anything about the token (that stays the
// scanner's job, which is authenticated) — it just explains what the code
// is and points the person the right direction, so a curious or confused
// scan never dead-ends on a blank page or raw text.
export default function CheckinLanding() {
  useParams();
  const { user } = useAuth();
  useSEO('Presence check-in code', undefined, { noindex: true });

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-screen flex flex-col">
      <PublicNav />
      <div className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="max-w-md w-full rounded-[26px] border shadow-2xl overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'linear-gradient(160deg,#151b34,#0d1122)' }}>
          <div className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <BrandMark size={28} />
              <span className="font-display font-bold text-sm" style={{ color: 'var(--pass-text)' }}>Presence</span>
            </div>

            <span className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(34,211,166,0.14)' }}>
              <ScanLine size={24} style={{ color: '#22D3A6' }} />
            </span>

            <h1 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--pass-text)' }}>This is a check-in code</h1>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--pass-text-dim)' }}>
              You've scanned a Presence event pass. It doesn't open anything by itself — an organizer scans it with
              the Presence check-in scanner at the entrance to confirm attendance.
            </p>

            <div className="rounded-xl px-4 py-3 mb-6 flex items-start gap-2.5 text-left" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <ShieldCheck size={16} className="shrink-0 mt-0.5" style={{ color: '#8B7CF6' }} />
              <p className="text-xs leading-relaxed" style={{ color: 'var(--pass-text-dim)' }}>
                For your security, this page never shows or verifies the code itself — only the organizer's signed-in
                scanner can do that.
              </p>
            </div>

            <Link
              to={user ? '/my-events' : '/login'}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg,#22D3A6,#8B7CF6)', color: '#04140f' }}
            >
              {user ? 'View my events' : <><LogIn size={16} /> Sign in to view your pass</>}
            </Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
