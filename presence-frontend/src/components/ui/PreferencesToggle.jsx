import { motion } from 'framer-motion';
import { Sun, Moon, Languages } from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';
import { useLanguage } from '../../lib/LanguageContext';

export default function PreferencesToggle() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isLight = theme === 'light';

  return (
    <div className="flex items-center gap-1.5">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        aria-label={t(isLight ? 'theme_toggle_dark' : 'theme_toggle_light')}
        title={t(isLight ? 'theme_toggle_dark' : 'theme_toggle_light')}
        className="w-9 h-9 rounded-full flex items-center justify-center border transition-colors hover:border-[#22D3A6]"
        style={{ borderColor: 'var(--line-12)', color: 'var(--text-dim)' }}
      >
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex"
        >
          {isLight ? <Sun size={16} /> : <Moon size={16} />}
        </motion.span>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggleLanguage}
        aria-label={t('language_label')}
        title={t('language_label')}
        className="flex items-center gap-1 rounded-full border px-2.5 h-9 text-xs font-semibold transition-colors hover:border-[#22D3A6]"
        style={{ borderColor: 'var(--line-12)', color: 'var(--text-dim)' }}
      >
        <Languages size={14} />
        {language.toUpperCase()}
      </motion.button>
    </div>
  );
}
