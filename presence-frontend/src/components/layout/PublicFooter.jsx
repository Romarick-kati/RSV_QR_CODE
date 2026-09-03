import { Link } from 'react-router-dom';
import BrandMark from '../ui/BrandMark';
import { Mail, Phone, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

const CONTACT_PHONE = '+237683794633';
const CONTACT_EMAIL = 'ndiromarickkati45@gmail.com';

// lucide-react dropped brand/logo icons a while back (trademark reasons),
// so these are small inline SVGs instead of a lucide import.
function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.14 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.8 8.44-4.94 8.44-9.94Z" />
    </svg>
  );
}
function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.05c.53-1 1.83-2.05 3.77-2.05C21.8 8.59 22 11 22 13.72V21h-4v-6.4c0-1.53-.03-3.5-2.13-3.5-2.14 0-2.47 1.67-2.47 3.39V21h-4V9Z" />
    </svg>
  );
}
function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" {...props}>
      <path d="M18.9 2H22l-7.3 8.34L23 22h-6.8l-5.3-6.94L4.8 22H1.7l7.8-8.9L1 2h7l4.8 6.34L18.9 2Zm-1.2 18h1.7L7.4 3.9H5.6L17.7 20Z" />
    </svg>
  );
}
function YouTubeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" {...props}>
      <path d="M21.6 7.2s-.2-1.5-.85-2.2c-.8-.86-1.7-.86-2.1-.9C15.9 4 12 4 12 4h0s-3.9 0-6.65.1c-.4.04-1.3.04-2.1.9-.65.7-.85 2.2-.85 2.2S2.2 9 2.2 10.7v1.5C2.2 14 2.4 15.7 2.4 15.7s.2 1.5.85 2.2c.8.86 1.85.83 2.3.92 1.7.16 6.45.2 6.45.2s3.9 0 6.65-.1c.4-.04 1.3-.04 2.1-.9.65-.7.85-2.2.85-2.2s.2-1.7.2-3.4v-1.5c0-1.7-.2-3.4-.2-3.4ZM9.9 14.6V9.4l5.4 2.6-5.4 2.6Z" />
    </svg>
  );
}

// Swap these placeholder "#" links for your real profile URLs once the
// accounts exist — everything else (icons, layout, hover states) is
// already wired up and needs no further changes.
const SOCIAL_LINKS = [
  { label: 'WhatsApp', icon: MessageCircle, href: `https://wa.me/${CONTACT_PHONE.replace('+', '')}`, color: '#25D366' },
  { label: 'Facebook', icon: FacebookIcon, href: 'https://www.facebook.com/ndiromarick.kati.1', color: '#1877F2' },
  { label: 'Instagram', icon: InstagramIcon, href: 'https://www.instagram.com/ndiromarick?igsi=MWJicHgybXQ1eXY5aQ==', color: '#E1306C' },
  { label: 'LinkedIn', icon: LinkedInIcon, href: 'https://www.linkedin.com/in/ndi-romarick-kati-0421a1320?utm_source=share_via&utm_content=profile&utm_medium=member_android', color: '#0A66C2' },
  { label: 'X (Twitter)', icon: XIcon, href: 'https://x.com/Romarick-Kati', color: '#e7e9ea' },
  { label: 'YouTube', icon: YouTubeIcon, href: 'https://youtube.com/@Romarick-Kati', color: '#FF0000' },
];

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
          <ul className="flex flex-col gap-2.5 text-sm text-[var(--text-dim)] mb-5">
            <li className="flex items-center gap-2">
              <Mail size={14} /> <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-[var(--text)]">{CONTACT_EMAIL}</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={14} /> <a href={`tel:${CONTACT_PHONE}`} className="hover:text-[var(--text)]">{CONTACT_PHONE}</a>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle size={14} />
              <a href={`https://wa.me/${CONTACT_PHONE.replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text)]">
                WhatsApp
              </a>
            </li>
          </ul>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text)] mb-3">Follow us</h4>
          <div className="flex flex-wrap gap-2">
            {SOCIAL_LINKS.map(({ label, icon: Icon, href, color }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="w-9 h-9 rounded-full flex items-center justify-center border transition-all hover:scale-110"
                style={{ borderColor: 'var(--line-12)', color: 'var(--text-dim)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = color; e.currentTarget.style.borderColor = color; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--line-12)'; }}
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t py-5 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center text-xs text-[var(--text-dim)]" style={{ borderColor: 'var(--line-06)' }}>
        <span>&copy; {new Date().getFullYear()} Presence. {t('footer_rights')}</span>
        <span className="hidden sm:inline">&middot;</span>
        <span>
          {t('footer_built_by')}{' '}
          <a href="https://kati-guidotti.netlify.app" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-[#22D3A6]">
            Ndi Romarick Kati
          </a>
        </span>
      </div>
    </footer>
  );
}
