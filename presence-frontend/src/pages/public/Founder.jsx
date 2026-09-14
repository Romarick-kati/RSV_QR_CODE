import { Globe, CloudSun, ArrowUpRight } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../../components/ui/BrandIcons';
import { Link } from 'react-router-dom';
import PublicNav from '../../components/layout/PublicNav';
import PublicFooter from '../../components/layout/PublicFooter';
import { useSEO, SITE_URL } from '../../lib/useSEO';
import { useLanguage } from '../../lib/LanguageContext';

const LINK_META = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ndi-romarick-kati-0421a1320/', icon: LinkedinIcon },
  { label: 'GitHub', href: 'https://github.com/Romarick-Kati', icon: GithubIcon },
  { labelKey: 'founder_link_portfolio', href: 'https://kati-guidotti.netlify.app', icon: Globe },
  { labelKey: 'founder_link_weather', href: 'https://kati-skyline.netlify.app', icon: CloudSun },
];
const LINKS = LINK_META.map((l) => ({ ...l })); // stable hrefs for JSON-LD sameAs, independent of language

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
  const { t } = useLanguage();
  const displayLinks = LINK_META.map((l) => ({ ...l, label: l.label || t(l.labelKey) }));
  useSEO(
    'Ndi Romarick Kati — Founder & Creator of Presence',
    'Ndi Romarick Kati is the founder and creator of Presence, a QR-powered event registration, check-in, and attendance management platform.',
    { path: '/founder', jsonLd: PERSON_JSON_LD }
  );

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-screen">
      <PublicNav />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-20">
        <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: '#F5A623' }}>{t('founder_eyebrow')}</span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2 mb-2">Ndi Romarick Kati</h1>
        <p className="text-base text-[var(--text-dim)] mb-8">{t('founder_subtitle')}</p>

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
            {t('founder_p1_before')}{' '}
            <Link to="/" className="font-semibold text-[var(--text)] hover:text-[var(--accent)]">Presence</Link>{t('founder_p1_after')}
          </p>
          <p>{t('founder_p2')}</p>
          <p>{t('founder_p3')}</p>
        </div>

        <div className="flex flex-wrap gap-2.5 mb-14">
          {displayLinks.map((l) => (
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
          <h2 className="font-display text-lg font-bold mb-2">{t('founder_about_heading')}</h2>
          <p className="text-sm text-[var(--text-dim)] leading-relaxed mb-4">
            {t('founder_about_copy')}
          </p>
          <Link to="/about" className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
            {t('founder_about_link')}
          </Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
