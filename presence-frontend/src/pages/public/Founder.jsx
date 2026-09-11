import { Globe, CloudSun, ArrowUpRight } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../../components/ui/BrandIcons';
import { Link } from 'react-router-dom';
import PublicNav from '../../components/layout/PublicNav';
import PublicFooter from '../../components/layout/PublicFooter';
import { useSEO, SITE_URL } from '../../lib/useSEO';

const LINKS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ndi-romarick-kati-0421a1320/', icon: LinkedinIcon },
  { label: 'GitHub', href: 'https://github.com/Romarick-Kati', icon: GithubIcon },
  { label: 'Portfolio', href: 'https://kati-guidotti.netlify.app', icon: Globe },
  { label: 'Skyline weather app', href: 'https://kati-skyline.netlify.app', icon: CloudSun },
];

// Person schema — only facts actually present elsewhere on this site (the
// same bio/links CreatorSection.jsx already shows on the homepage), so this
// page and its structured data never claim anything unverifiable: no
// invented job titles, employers, awards, or credentials.
const PERSON_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Ndi Romarick Kati',
  url: `${SITE_URL}/founder`,
  jobTitle: 'Full-Stack Developer',
  description: 'Ndi Romarick Kati is the founder and creator of Presence, a QR-based event registration and attendance tracking platform.',
  knowsAbout: ['MongoDB', 'Express.js', 'React', 'Node.js', 'Full-stack web development'],
  sameAs: LINKS.map((l) => l.href),
  worksFor: {
    '@type': 'WebApplication',
    name: 'Presence',
    url: SITE_URL,
  },
};

export default function Founder() {
  useSEO(
    'Ndi Romarick Kati — Founder & Creator of Presence',
    'Ndi Romarick Kati is the founder and creator of Presence, a QR-powered event registration, check-in, and attendance management platform.',
    { path: '/founder', jsonLd: PERSON_JSON_LD }
  );

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-screen">
      <PublicNav />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-20">
        <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: '#F5A623' }}>Founder</span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2 mb-2">Ndi Romarick Kati</h1>
        <p className="text-base text-[var(--text-dim)] mb-8">Founder &amp; Creator of Presence</p>

        <img
          src="/creator.jpg"
          alt="Ndi Romarick Kati, full-stack MERN developer and founder of Presence"
          width={128}
          height={128}
          loading="lazy"
          className="w-32 h-32 rounded-2xl object-cover mb-8 border"
          style={{ borderColor: 'var(--line-14)' }}
        />

        <div className="prose-content text-[var(--text-dim)] leading-relaxed space-y-5 mb-12">
          <p>
            Ndi Romarick Kati is a full-stack developer working across the MERN stack — MongoDB, Express,
            React, and Node.js. He is the founder and creator of{' '}
            <Link to="/" className="font-semibold text-[var(--text)] hover:text-[var(--accent)]">Presence</Link>,
            an event registration and QR-based attendance tracking platform built to replace paper sign-in
            sheets with a verified, digital check-in process.
          </p>
          <p>
            Presence was built end-to-end — the React frontend, the Express and MongoDB backend, QR pass
            generation, real-time check-in verification, and Mobile Money payment integration for paid events
            — as a complete, working system rather than a prototype.
          </p>
          <p>
            You can find more of his work and get in touch through the links below.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 mb-14">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg border hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              style={{ borderColor: 'var(--line-14)' }}
            >
              <l.icon size={14} /> {l.label} <ArrowUpRight size={11} className="opacity-60" />
            </a>
          ))}
        </div>

        <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
          <h2 className="font-display text-lg font-bold mb-2">About Presence</h2>
          <p className="text-sm text-[var(--text-dim)] leading-relaxed mb-4">
            Presence pairs a simple RSVP flow with a QR-based check-in system — every registration produces a
            unique digital pass, and every check-in is verified against that pass on the server.
          </p>
          <Link to="/about" className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
            Learn about Presence →
          </Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
