import { ShieldCheck, ScanLine, BarChart3, Users } from 'lucide-react';
import PublicNav from '../../components/layout/PublicNav';
import PublicFooter from '../../components/layout/PublicFooter';
import { useSEO } from '../../lib/useSEO';

const PILLARS = [
  { icon: Users, title: 'For attendees', copy: 'Register for an event once, receive a digital pass instantly, and reuse it every time you check in.' },
  { icon: ScanLine, title: 'For organizers', copy: 'Publish an event, watch RSVPs come in, and scan attendees at the door with any device camera.' },
  { icon: ShieldCheck, title: 'For integrity', copy: 'Every QR pass carries a server-verified token, never personal data, so check-in results can be trusted.' },
  { icon: BarChart3, title: 'For decisions', copy: 'Live dashboards turn attendance into a number you can report on, not a stack of paper to count by hand.' },
];

export default function About() {
  useSEO('About', 'Presence replaces paper sign-in sheets with online RSVPs, digital QR passes, and one verified scan at check-in.');
  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-screen">
      <PublicNav />
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-20">
        <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: '#F5A623' }}>About Presence</span>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-2 mb-6">A digital replacement for the sign-in sheet</h1>
        <p className="text-[var(--text-dim)] leading-relaxed mb-6">
          Presence was built to solve a familiar problem on campus: registration lists kept in spreadsheets,
          attendance tracked with paper and a pen, and no reliable way to know who actually showed up until
          someone counts the sheet by hand afterward.
        </p>
        <p className="text-[var(--text-dim)] leading-relaxed mb-14">
          The platform pairs a simple RSVP flow with a QR-based check-in system. Every registration produces a
          unique digital pass; every check-in is verified against that pass on the server, so duplicate scans
          and forged codes are rejected automatically, and organizers can watch attendance update live.
        </p>

        <div className="grid sm:grid-cols-2 gap-5">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-2xl border p-6" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
              <span className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(34,211,166,0.12)' }}>
                <p.icon size={20} style={{ color: '#22D3A6' }} />
              </span>
              <h3 className="font-display text-base font-semibold mb-1.5">{p.title}</h3>
              <p className="text-sm text-[var(--text-dim)] leading-relaxed">{p.copy}</p>
            </div>
          ))}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
