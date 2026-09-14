import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import PublicNav from '../../components/layout/PublicNav';
import PublicFooter from '../../components/layout/PublicFooter';
import { useSEO } from '../../lib/useSEO';
import { useLanguage } from '../../lib/LanguageContext';

const FAQ_KEYS = [1, 2, 3, 4, 5, 6, 7];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  const { t } = useLanguage();
  const FAQS = FAQ_KEYS.map((i) => ({ q: t(`faq_q${i}`), a: t(`faq_a${i}`) }));
  useSEO('FAQ', 'Answers to common questions about registering for events, digital QR passes, and how check-in works on Presence.', { path: '/faq' });
  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-screen">
      <PublicNav />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-20">
        <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: '#F5A623' }}>{t('faq_eyebrow')}</span>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-2 mb-10">{t('faq_heading')}</h1>
        <div className="flex flex-col gap-3">
          {FAQS.map((f, i) => (
            <div key={f.q} className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--line-08)', background: 'var(--panel)' }}>
              <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                <span className="font-medium text-[var(--text)] text-sm">{f.q}</span>
                <ChevronDown size={16} className="text-[var(--text-dim)] transition-transform shrink-0" style={{ transform: open === i ? 'rotate(180deg)' : 'none' }} />
              </button>
              {open === i && <p className="px-5 pb-4 text-sm text-[var(--text-dim)] leading-relaxed">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
