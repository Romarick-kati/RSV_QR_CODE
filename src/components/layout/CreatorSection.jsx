import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faGlobe, faCloudSun, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useLanguage } from '../../lib/LanguageContext';

const LINKS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ndi-romarick-kati-0421a1320/', icon: faLinkedin },
  { label: 'GitHub', href: 'https://github.com/Romarick-Kati', icon: faGithub },
  { label: 'Portfolio', href: 'https://kati-guidotti.netlify.app', icon: faGlobe },
  { label: 'Skyline weather app', href: 'https://kati-skyline.netlify.app', icon: faCloudSun },
];

export default function CreatorSection() {
  const { t } = useLanguage();
  return (
    <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-24" itemScope itemType="https://schema.org/Person">
      {/* Fixed dark surface regardless of site theme, like the digital pass —
          text here uses --pass-text tokens rather than the themed ones. */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[28px] border p-8 sm:p-10 relative overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'linear-gradient(160deg,#151b34,#0d1122)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 85% 0%, rgba(139,124,246,0.14), transparent 55%)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-7">
          <motion.img
            src="/creator.jpg"
            alt="Ndi Romarick Kati, full-stack MERN developer and builder of Presence"
            itemProp="image"
            width={112}
            height={112}
            loading="lazy"
            whileHover={{ scale: 1.05, rotate: -2 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="w-28 h-28 rounded-2xl object-cover shrink-0 border"
            style={{ borderColor: 'rgba(255,255,255,0.14)' }}
          />
          <div className="text-center sm:text-left flex-1">
            <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: '#F5A623' }}>{t('footer_built_by')}</span>
            <h2 className="font-display text-2xl font-bold mt-1 mb-1.5" itemProp="name" style={{ color: 'var(--pass-text)' }}>Ndi Romarick Kati</h2>
            <p className="text-sm leading-relaxed max-w-xl mb-5" itemProp="description" style={{ color: 'var(--pass-text-dim)' }}>
              A full-stack developer working across the MERN stack: MongoDB, Express, React and Node.js.
              Presence was built end-to-end — from the React frontend through to the Express and
              PostgreSQL backend.
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2.5">
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  itemProp="sameAs"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  whileHover={{ y: -2 }}
                  className="flex items-center gap-2 text-[13px] font-medium px-3.5 py-2 rounded-lg border hover:border-[#22D3A6] hover:text-[#22D3A6] transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'var(--pass-text-dim)' }}
                >
                  <FontAwesomeIcon icon={l.icon} /> {l.label} <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="opacity-60 text-[10px]" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
