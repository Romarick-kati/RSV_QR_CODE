import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Phone, MessageCircle, ArrowUp, ArrowRight, ShieldCheck } from 'lucide-react';
import Globe from '../ui/Globe';
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

function WhatsAppIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" {...props}>
      <path d="M12.04 2a9.93 9.93 0 0 0-8.5 15.04L2 22l5.1-1.5A9.94 9.94 0 1 0 12.04 2Zm5.8 14.1c-.25.7-1.44 1.33-1.98 1.4-.5.07-1.13.1-1.82-.12-.42-.14-.96-.31-1.65-.6-2.9-1.25-4.8-4.17-4.94-4.36-.14-.2-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.26-.29.57-.36.76-.36l.55.01c.18.01.42-.07.66.5.25.6.85 2.07.92 2.22.08.15.13.32.03.52-.1.2-.15.32-.3.5l-.45.52c-.15.15-.3.31-.13.6.17.3.77 1.27 1.65 2.06 1.13 1 2.09 1.32 2.39 1.47.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.72.81 2.02.96.3.15.5.22.57.35.07.12.07.72-.18 1.42Z" />
    </svg>
  );
}

// Swap these placeholder "#" links for your real profile URLs once the
// accounts exist — everything else (icons, layout, hover states) is
// already wired up and needs no further changes.
const SOCIAL_LINKS = [
  { label: 'WhatsApp', icon: WhatsAppIcon, href: `https://wa.me/${CONTACT_PHONE.replace('+', '')}`, color: '#25D366' },
  { label: 'Facebook', icon: FacebookIcon, href: 'https://www.facebook.com/ndiromarick.kati.1', color: '#1877F2' },
  { label: 'Instagram', icon: InstagramIcon, href: 'https://www.instagram.com/ndiromarick?igsi=MWJicHgybXQ1eXY5aQ==', color: '#E1306C' },
  { label: 'LinkedIn', icon: LinkedInIcon, href: 'https://www.linkedin.com/in/ndi-romarick-kati-0421a1320?utm_source=share_via&utm_content=profile&utm_medium=member_android', color: '#0A66C2' },
  { label: 'X (Twitter)', icon: XIcon, href: 'https://x.com/Romarick-Kati', color: '#e7e9ea' },
  { label: 'YouTube', icon: YouTubeIcon, href: 'https://youtube.com/@Romarick-Kati', color: '#FF0000' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } };
const linkCls = 'inline-block text-[var(--text-dim)] hover:text-[var(--text)] hover:translate-x-1 transition-all';

export default function PublicFooter() {
  const { t } = useLanguage();
  return (
    <footer className="relative mt-24 border-t overflow-hidden" style={{ borderColor: 'var(--line-08)', background: 'var(--bg)' }}>
      {/* soft breathing glow + a slowly turning globe fill the empty space */}
      <div className="footer-glow absolute -bottom-40 left-1/2 -translate-x-1/2 w-[720px] h-[320px] rounded-full blur-[110px] pointer-events-none" style={{ background: 'var(--accent)', opacity: 0.35 }} aria-hidden="true" />
      <div className="hidden lg:block absolute -right-24 -bottom-32 opacity-40 pointer-events-none" aria-hidden="true">
        <Globe size={420} />
      </div>

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-14">
        {/* call-to-action band */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border p-6 sm:p-8 mb-14 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
          style={{ borderColor: 'var(--line-12)', background: 'var(--panel)' }}
        >
          <div>
            <p className="font-display text-xl sm:text-2xl font-semibold">{t('footer_cta_title')}</p>
            <p className="text-sm text-[var(--text-dim)] mt-1">{t('footer_cta_sub')}</p>
          </div>
          <Link to="/register" className="btn-pop inline-flex items-center justify-center gap-2 font-semibold text-sm px-5 py-3 rounded-xl shrink-0" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', color: 'var(--accent-ink)' }}>
            {t('footer_cta_btn')} <ArrowRight size={16} />
          </Link>
        </motion.div>

        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="grid grid-cols-2 md:grid-cols-12 gap-10 pb-12">
          <motion.div variants={item} className="col-span-2 md:col-span-5">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <img src="/icon-192.png" width={32} height={32} alt="Presence Scan logo, a check mark in a teal and violet circle" className="rounded-full" />
              <span className="font-display font-bold text-lg">Presence</span>
            </Link>
            <p className="text-sm text-[var(--text-dim)] max-w-sm leading-relaxed mb-5">{t('footer_tagline')}</p>
            <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border" style={{ borderColor: 'var(--line-12)', color: 'var(--text-dim)' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22D3A6' }} /> {t('footer_status')}
            </span>
          </motion.div>

          <motion.div variants={item} className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text)] mb-3.5">{t('footer_platform')}</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><Link to="/events" className={linkCls}>{t('footer_browse_events')}</Link></li>
              <li><Link to="/discover" className={linkCls}>{t('nav_discover')}</Link></li>
              <li><Link to="/about" className={linkCls}>{t('footer_how_it_works')}</Link></li>
              <li><Link to="/register" className={linkCls}>{t('footer_create_account')}</Link></li>
            </ul>
          </motion.div>

          <motion.div variants={item} className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text)] mb-3.5">{t('footer_company')}</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><Link to="/founder" className={linkCls}>{t('footer_founder')}</Link></li>
              <li><Link to="/faq" className={linkCls}>{t('nav_faq')}</Link></li>
              <li><Link to="/privacy" className={linkCls}>{t('footer_privacy')}</Link></li>
              <li><Link to="/terms" className={linkCls}>{t('footer_terms')}</Link></li>
            </ul>
          </motion.div>

          <motion.div variants={item} className="col-span-2 md:col-span-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text)] mb-3.5">{t('footer_contact')}</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-[var(--text-dim)] mb-5">
              <li className="flex items-center gap-2"><Mail size={14} /> <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-[var(--text)] break-all">{CONTACT_EMAIL}</a></li>
              <li className="flex items-center gap-2"><Phone size={14} /> <a href={`tel:${CONTACT_PHONE}`} className="hover:text-[var(--text)]">{CONTACT_PHONE}</a></li>
              <li className="flex items-center gap-2"><MessageCircle size={14} /> <a href={`https://wa.me/${CONTACT_PHONE.replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text)]">WhatsApp</a></li>
            </ul>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text)] mb-3">{t('footer_follow')}</h4>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_LINKS.map(({ label, icon: Icon, href, color }) => (
                <motion.a
                  key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}
                  whileHover={{ y: -4, scale: 1.08 }} whileTap={{ scale: 0.94 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors"
                  style={{ '--brand': color, color, background: `color-mix(in srgb, ${color} 14%, transparent)`, borderColor: `color-mix(in srgb, ${color} 35%, transparent)` }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = color; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = `color-mix(in srgb, ${color} 14%, transparent)`; e.currentTarget.style.color = color; }}
                >
                  <Icon size={17} />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="relative border-t" style={{ borderColor: 'var(--line-06)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-dim)]">
          <span className="text-center sm:text-left">
            &copy; {new Date().getFullYear()} Presence. {t('footer_rights')} &middot; {t('footer_built_by')}{' '}
            <a href="https://kati-guidotti.netlify.app" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-[#22D3A6]">Ndi Romarick Kati</a>
          </span>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-[var(--text)]">{t('footer_privacy')}</Link>
            <Link to="/terms" className="hover:text-[var(--text)]">{t('footer_terms')}</Link>
            <span className="hidden sm:inline-flex items-center gap-1"><ShieldCheck size={13} /> HTTPS</span>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label={t('footer_back_top')} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--line-12)' }}>
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
