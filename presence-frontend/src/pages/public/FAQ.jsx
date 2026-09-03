import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import PublicNav from '../../components/layout/PublicNav';
import PublicFooter from '../../components/layout/PublicFooter';
import { useSEO } from '../../lib/useSEO';

const FAQS = [
  { q: 'How do I register for an event?', a: 'Open the event page and select "RSVP for this event." If you\u2019re not signed in yet, you\u2019ll be asked to create an account first, then registration itself takes under a minute.' },
  { q: 'How do I access my digital pass?', a: 'After registering, your pass opens automatically. You can always find it again under "My events" in your dashboard.' },
  { q: 'What happens if I lose signal at the door?', a: 'Your QR pass is a static image once loaded, so it will display even offline. The scanner device on the organizer\u2019s side needs connectivity to verify it.' },
  { q: 'Can I register for an event that is full?', a: 'No, once an event reaches capacity, RSVP is disabled for that event. Organizers can raise capacity before the registration deadline if space allows.' },
  { q: 'What happens if my QR code is scanned twice?', a: 'The second scan is rejected with "Already checked in." Only the first valid scan is recorded as attendance.' },
  { q: 'Can I cancel my registration?', a: 'Yes, from "My events" in your dashboard. This frees your spot for someone else before the registration deadline.' },
  { q: 'How is my data protected?', a: 'Your QR code encodes a random, unique token rather than any personal information. The server looks up your registration from that token, which is never embedded in the code itself.' },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  useSEO('FAQ', 'Answers to common questions about registering for events, digital QR passes, and how check-in works on Presence.');
  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-screen">
      <PublicNav />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-20">
        <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: '#F5A623' }}>Support</span>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-2 mb-10">Frequently asked questions</h1>
        <div className="flex flex-col gap-3">
          {FAQS.map((f, i) => (
            <div key={f.q} className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
              <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                <span className="font-medium text-[var(--text)] text-sm">{f.q}</span>
                <ChevronDown size={16} className="text-[var(--text-dim)] transition-transform shrink-0" style={{ transform: open === i ? 'rotate(180deg)' : 'none' }} />
              </button>
              {open === i && <p className="px-5 pb-4 text-sm text-[var(--text-dim)] leading-relaxed">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
