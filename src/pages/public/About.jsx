import { ShieldCheck, ScanLine, BarChart3, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicNav from '../../components/layout/PublicNav';
import PublicFooter from '../../components/layout/PublicFooter';
import { Reveal, RevealGroup, RevealItem } from '../../components/ui/Reveal';
import { useSEO } from '../../lib/useSEO';
import { useLanguage } from '../../lib/LanguageContext';

const PILLAR_META = [
  { icon: Users, n: 1 },
  { icon: ScanLine, n: 2 },
  { icon: ShieldCheck, n: 3 },
  { icon: BarChart3, n: 4 },
];

export default function About() {
  const { t } = useLanguage();
  const PILLARS = PILLAR_META.map((p) => ({ icon: p.icon, title: t(`about_pillar${p.n}_title`), copy: t(`about_pillar${p.n}_copy`) }));
  useSEO('About', 'Presence replaces paper sign-in sheets with online RSVPs, digital QR passes, and one verified scan at check-in.', { path: '/about' });
  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-screen">
      <PublicNav />
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-20">
        <Reveal>
          <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: '#F5A623' }}>{t('about_eyebrow')}</span>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-2 mb-6">{t('about_heading')}</h1>
          <p className="text-[var(--text-dim)] leading-relaxed mb-6">
            {t('about_p1')}
          </p>
          <p className="text-[var(--text-dim)] leading-relaxed mb-14">
            {t('about_p2')}
          </p>
        </Reveal>

        <RevealGroup className="grid sm:grid-cols-2 gap-5">
          {PILLARS.map((p, i) => (
            <RevealItem key={p.title} direction={i % 2 === 0 ? 'left' : 'right'} className="rounded-2xl border p-6" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
              <span className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(34,211,166,0.12)' }}>
                <p.icon size={20} style={{ color: '#22D3A6' }} />
              </span>
              <h3 className="font-display text-base font-semibold mb-1.5">{p.title}</h3>
              <p className="text-sm text-[var(--text-dim)] leading-relaxed">{p.copy}</p>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal>
          <Link
            to="/founder"
            className="mt-10 flex items-center justify-between gap-4 rounded-2xl border p-6 hover-lift hover:border-[var(--accent)] transition-colors"
            style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}
          >
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>{t('about_created_by')}</span>
              <h3 className="font-display text-lg font-bold mt-1">{t('about_meet_creator')}</h3>
              <p className="text-sm text-[var(--text-dim)] mt-1">{t('about_founder_role')}</p>
            </div>
            <ArrowRight size={20} className="shrink-0" style={{ color: 'var(--accent)' }} />
          </Link>
        </Reveal>
      </div>
      <PublicFooter />
    </div>
  );
}
