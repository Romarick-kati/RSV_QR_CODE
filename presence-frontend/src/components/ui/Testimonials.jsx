import { Star } from 'lucide-react';

// Add REAL quotes from real users here, e.g.
//   { name: 'Full name', role: 'Organizer, Event name', title: 'Short headline', text: 'What they said.', stars: 5 }
// Only add feedback people actually gave you (ask permission to use their
// name). While this list is empty the whole section stays hidden, so the
// site never shows invented reviews.
const TESTIMONIALS = [];

function Card({ t }) {
  return (
    <figure className="rounded-2xl border p-5" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
      <div className="flex gap-0.5 mb-3" aria-label={`${t.stars || 5} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={15} fill={i < (t.stars || 5) ? 'var(--accent)' : 'none'} style={{ color: 'var(--accent)' }} />)}
      </div>
      {t.title && <p className="font-display font-semibold mb-1.5">&ldquo;{t.title}&rdquo;</p>}
      <blockquote className="text-sm text-[var(--text-dim)] leading-relaxed">{t.text}</blockquote>
      <figcaption className="text-xs text-[var(--text-dim)] mt-3">&ndash; {t.name}{t.role ? `, ${t.role}` : ''}</figcaption>
    </figure>
  );
}

// Three columns of cards that keep scrolling upward forever (the middle one
// slower), fading at the top and bottom. Pauses on hover.
export default function Testimonials() {
  if (!TESTIMONIALS.length) return null;
  const cols = [0, 1, 2].map((c) => TESTIMONIALS.filter((_, i) => i % 3 === c));
  const speeds = ['42s', '54s', '46s'];
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
      <h2 className="font-display text-3xl font-bold text-center mb-10">Loved by organizers and attendees</h2>
      <div className="marquee-wall grid md:grid-cols-3 gap-4 h-[520px] overflow-hidden" style={{ maskImage: 'linear-gradient(transparent,#000 12%,#000 88%,transparent)', WebkitMaskImage: 'linear-gradient(transparent,#000 12%,#000 88%,transparent)' }}>
        {cols.map((items, ci) => items.length > 0 && (
          <div key={ci} className={ci === 1 ? 'hidden md:block' : ci === 2 ? 'hidden md:block' : ''}>
            <div className="marquee-col" style={{ '--col-speed': speeds[ci] }}>
              {[...items, ...items].map((t, i) => <Card key={i} t={t} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
