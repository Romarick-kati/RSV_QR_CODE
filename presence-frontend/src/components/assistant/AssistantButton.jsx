import { useAssistant } from '../../lib/AssistantContext';
import { useLanguage } from '../../lib/LanguageContext';
import AssistantSparkle from './AssistantSparkle';

export default function AssistantButton({ className = '' }) {
  const { open } = useAssistant();
  const { t } = useLanguage();
  return (
    <button
      onClick={open}
      title={t('asst_nav_label')}
      aria-label={t('asst_nav_label')}
      className={`assistant-trigger relative w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-dim)] hover:text-[var(--text)] transition-colors ${className}`}
    >
      {/* Soft blurred halo behind the icon — breathes slowly at rest, the
          one place on this button that's allowed to move on its own. */}
      <span className="assistant-trigger-glow" aria-hidden="true" />
      <AssistantSparkle size={18} className="relative" />
    </button>
  );
}
