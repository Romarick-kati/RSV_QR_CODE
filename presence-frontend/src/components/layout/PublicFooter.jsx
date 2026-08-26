import { Link } from 'react-router-dom';
import BrandMark from '../ui/BrandMark';
import { Mail, MapPin } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

export default function PublicFooter() {
  const { t } = useLanguage();
  return (
    <footer className="border-t mt-24" style={{ borderColor: 'var(--line-08)', background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2.5 mb-4">
            <BrandMark size={32} />
            <span className="font-display font-bold text-lg">Presence</span>
          </Link>
          <p className="text-sm text-[var(--text-dim)] max-w-sm leading-relaxed">
            {t('footer_tagline')}
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text)] mb-3.5">{t('footer_platform')}</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-[var(--text-dim)]">
            <li><Link to="/events" className="hover:text-[var(--text)]">{t('footer_browse_events')}</Link></li>
            <li><Link to="/about" className="hover:text-[var(--text)]">{t('footer_how_it_works')}</Link></li>
            <li><Link to="/faq" className="hover:text-[var(--text)]">{t('nav_faq')}</Link></li>
            <li><Link to="/register" className="hover:text-[var(--text)]">{t('footer_create_account')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text)] mb-3.5">{t('footer_contact')}</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-[var(--text-dim)]">
            <li className="flex items-center gap-2"><Mail size={14} /> events@university.edu</li>
            <li className="flex items-center gap-2"><MapPin size={14} /> Main Campus, Engineering Faculty</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-5 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center text-xs text-[var(--text-dim)]" style={{ borderColor: 'var(--line-06)' }}>
        <span>&copy; {new Date().getFullYear()} Presence. {t('footer_rights')}</span>
        <span className="hidden sm:inline">&middot;</span>
        <span>
          {t('footer_built_by')}{' '}
          <a href="https://kati-guidotti.netlify.app" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-[#22D3A6]">
            Ndi Romarick Kati
          </a>
        </span>
      </div>
    </footer>
  );
}
