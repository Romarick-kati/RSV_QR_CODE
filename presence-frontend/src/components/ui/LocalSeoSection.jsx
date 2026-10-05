import { Link } from 'react-router-dom';
import { useLanguage } from '../../lib/LanguageContext';

// Renders a translated paragraph that contains exactly one {token}, replacing
// it with a real <Link> so the sentence stays natural in either language
// instead of bolting the link on before/after the translated text.
function ParaWithLink({ text, token, to, children }) {
  const [before, after] = text.split(token);
  return (
    <p>
      {before}
      <Link to={to} className="underline" style={{ color: 'var(--accent)' }}>{children}</Link>
      {after}
    </p>
  );
}

// Plain, readable copy that says who Presence is for and where it works, with
// internal links to the main pages. Written for people first; search engines
// pick up the topics (event registration, QR check-in, Mobile Money,
// Cameroon) from natural sentences instead of keyword lists.
export default function LocalSeoSection() {
  const { t } = useLanguage();
  return (
    <section className="max-w-4xl mx-auto px-5 sm:px-8 py-16" aria-labelledby="who-title">
      <h2 id="who-title" className="font-display text-2xl sm:text-3xl font-bold mb-4">{t('seo_who_title')}</h2>
      <div className="grid sm:grid-cols-2 gap-x-10 gap-y-4 text-sm text-[var(--text-dim)] leading-relaxed">
        <ParaWithLink text={t('seo_who_p1')} token="{registerLink}" to="/events">{t('seo_who_p1_link')}</ParaWithLink>
        <ParaWithLink text={t('seo_who_p2')} token="{aboutLink}" to="/about">{t('seo_who_p2_link')}</ParaWithLink>
        <p>{t('seo_who_p3')}</p>
        <p>
          {(() => {
            const parts = t('seo_who_p4').split(/\{discoverLink\}|\{faqLink\}|\{founderLink\}/);
            return (
              <>
                {parts[0]}
                <Link to="/discover" className="underline" style={{ color: 'var(--accent)' }}>{t('seo_who_p4_discover')}</Link>
                {parts[1]}
                <Link to="/faq" className="underline" style={{ color: 'var(--accent)' }}>{t('seo_who_p4_faq')}</Link>
                {parts[2]}
                <Link to="/founder" className="underline" style={{ color: 'var(--accent)' }}>{t('seo_who_p4_founder')}</Link>
                {parts[3]}
              </>
            );
          })()}
        </p>
      </div>
    </section>
  );
}
