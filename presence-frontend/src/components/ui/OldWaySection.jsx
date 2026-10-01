import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';

// Photo band that frames the problem Presence solves. The <img> carries a
// descriptive alt text, real dimensions (no layout shift) and lazy loading,
// which is what image search and Core Web Vitals both reward.
export default function OldWaySection() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16" aria-labelledby="old-way-title">
      <Reveal>
        <figure className="relative rounded-[28px] overflow-hidden border shadow-2xl" style={{ borderColor: 'var(--line-12)' }}>
          <picture>
            <source srcSet="/paper-sign-in-sheet.webp" type="image/webp" />
            <img
              src="/paper-sign-in-sheet.jpg"
              width="878"
              height="372"
              loading="lazy"
              decoding="async"
              alt="A person signing a paper attendance sheet at a reception desk, the slow sign-in method that Presence QR check-in replaces"
              className="w-full h-[340px] sm:h-[420px] object-cover object-[60%_60%]"
            />
          </picture>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(10,13,24,0.92) 0%, rgba(10,13,24,0.7) 45%, rgba(10,13,24,0.1) 100%)' }} />
          <figcaption className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 max-w-xl">
            <span className="flex items-center gap-2 mb-3">
              <img src="/icon-192.png" width="28" height="28" alt="Presence logo" className="rounded-full" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: '#22D3A6' }}>The old way</span>
            </span>
            <h2 id="old-way-title" className="font-display text-2xl sm:text-4xl font-bold leading-tight mb-3" style={{ color: '#fff' }}>
              Still passing a paper sign-in sheet around?
            </h2>
            <p className="text-sm sm:text-base leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.78)' }}>
              Sheets get lost, names are copied, and nobody can prove who really came. Presence gives every guest a QR pass and checks them in with one scan, with a live count as people arrive.
            </p>
            <Link to="/register" className="btn-pop self-start inline-flex items-center gap-2 font-semibold text-sm px-5 py-3 rounded-xl" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', color: 'var(--accent-ink)' }}>
              Replace the sheet <ArrowRight size={16} />
            </Link>
          </figcaption>
        </figure>
      </Reveal>
    </section>
  );
}
