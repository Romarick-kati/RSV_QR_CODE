import { Link } from 'react-router-dom';

// Plain, readable copy that says who Presence is for and where it works, with
// internal links to the main pages. Written for people first; search engines
// pick up the topics (event registration, QR check-in, Mobile Money,
// Cameroon) from natural sentences instead of keyword lists.
export default function LocalSeoSection() {
  return (
    <section className="max-w-4xl mx-auto px-5 sm:px-8 py-16" aria-labelledby="who-title">
      <h2 id="who-title" className="font-display text-2xl sm:text-3xl font-bold mb-4">Event registration and QR check-in for Cameroon and beyond</h2>
      <div className="grid sm:grid-cols-2 gap-x-10 gap-y-4 text-sm text-[var(--text-dim)] leading-relaxed">
        <p>
          Presence is a free event management app built in Douala. Organizers of conferences, workshops, church programs, school events, weddings and community meetings create an event in minutes, share the link, and let guests <Link to="/events" className="underline" style={{ color: 'var(--accent)' }}>register online</Link>.
        </p>
        <p>
          Every guest gets a digital QR pass on their phone. At the door, one scan verifies the pass and records attendance, so you get a reliable guest list without paper. See how it works on the <Link to="/about" className="underline" style={{ color: 'var(--accent)' }}>about page</Link>.
        </p>
        <p>
          Selling tickets? Attendees can pay with MTN Mobile Money or Orange Money, and their pass unlocks automatically once the payment is confirmed. Free events need nothing more than an RSVP.
        </p>
        <p>
          Not sure where to start? Browse <Link to="/discover" className="underline" style={{ color: 'var(--accent)' }}>upcoming events</Link>, read the <Link to="/faq" className="underline" style={{ color: 'var(--accent)' }}>FAQ</Link>, or meet <Link to="/founder" className="underline" style={{ color: 'var(--accent)' }}>the founder</Link>.
        </p>
      </div>
    </section>
  );
}
