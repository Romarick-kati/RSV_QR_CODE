import { X, Check } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

function Row({ text, good }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border px-3.5 py-3 text-sm" style={{ borderColor: good ? 'rgba(34,211,166,0.25)' : 'rgba(255,92,119,0.2)', background: 'var(--panel)' }}>
      <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-px" style={{ background: good ? '#22D3A6' : '#FF5C77' }}>
        {good ? <Check size={14} color="#0A0D18" strokeWidth={3} /> : <X size={14} color="#fff" strokeWidth={3} />}
      </span>
      <span className="text-[var(--text)]">{text}</span>
    </li>
  );
}

export default function WithWithout() {
  const { t } = useLanguage();
  const WITHOUT = [1, 2, 3, 4, 5, 6, 7].map((i) => t(`compare_without_${i}`));
  const WITH = [1, 2, 3, 4, 5, 6].map((i) => t(`compare_with_${i}`));
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
      <h2 className="font-display text-3xl font-bold text-center mb-10">{t('compare_title')}</h2>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="rounded-3xl border p-5 sm:p-6" style={{ borderColor: 'var(--line-08)' }}>
          <h3 className="flex items-center gap-2.5 font-display text-lg font-semibold mb-4"><span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#FF5C77' }}><X size={15} color="#fff" strokeWidth={3} /></span> {t('compare_without_title')}</h3>
          <ul className="flex flex-col gap-2.5">{WITHOUT.map((txt) => <Row key={txt} text={txt} />)}</ul>
        </div>
        <div className="rounded-3xl border p-5 sm:p-6 md:-mt-3 shadow-xl" style={{ borderColor: 'rgba(34,211,166,0.45)', background: 'rgba(34,211,166,0.04)' }}>
          <h3 className="flex items-center gap-2.5 font-display text-lg font-semibold mb-4"><span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#22D3A6' }}><Check size={15} color="#0A0D18" strokeWidth={3} /></span> {t('compare_with_title')}</h3>
          <ul className="flex flex-col gap-2.5">{WITH.map((txt) => <Row key={txt} text={txt} good />)}</ul>
        </div>
      </div>
    </section>
  );
}
