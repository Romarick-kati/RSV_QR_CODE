import { CheckCircle2, LogIn, QrCode, ScanLine, ShieldCheck, Ticket, Users, Smartphone } from 'lucide-react';

const ITEMS = [
  { icon: LogIn, label: 'Secure login' },
  { icon: Ticket, label: 'RSVP confirmed' },
  { icon: QrCode, label: 'QR pass issued' },
  { icon: ScanLine, label: 'Check-in ready' },
  { icon: Users, label: 'Guest list synced' },
  { icon: Smartphone, label: 'Mobile Money paid' },
  { icon: ShieldCheck, label: 'One scan per pass' },
  { icon: CheckCircle2, label: 'Attendance verified' },
];

// Endless left-moving strip of status pills. The list is rendered twice and
// the track slides by exactly half its width, so the loop has no visible jump.
export default function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="marquee overflow-hidden py-5 border-y" style={{ borderColor: 'var(--line-08)', maskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)' }} aria-hidden="true">
      <div className="marquee-track gap-3">
        {row.map(({ icon: Icon, label }, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-semibold uppercase tracking-[0.18em] whitespace-nowrap mr-3" style={{ borderColor: 'var(--line-12)', color: 'var(--text-dim)', background: 'var(--panel)' }}>
            <Icon size={13} style={{ color: 'var(--accent)' }} /> {label}
          </span>
        ))}
      </div>
    </div>
  );
}
