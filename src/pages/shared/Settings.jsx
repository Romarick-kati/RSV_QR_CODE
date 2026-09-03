import { motion } from 'framer-motion';
import { Check, Sun, Moon, Languages, Palette, User, Shield, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import AttendeeShell from '../../components/layout/AttendeeShell';
import AdminShell from '../../components/layout/AdminShell';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/ThemeContext';
import { useAccent, ACCENT_PRESETS } from '../../lib/AccentContext';
import { useLanguage } from '../../lib/LanguageContext';

function SettingsContent() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { accentId, setAccentId } = useAccent();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="max-w-2xl space-y-8">
      {/* --- Appearance: accent color --- */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border p-5 sm:p-6"
        style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }}
      >
        <div className="flex items-center gap-2.5 mb-1">
          <Palette size={18} style={{ color: 'var(--accent)' }} />
          <h2 className="font-display text-lg font-bold">{t('settings_appearance')}</h2>
        </div>
        <p className="text-sm text-[var(--text-dim)] mb-5">{t('settings_appearance_desc')}</p>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-6">
          {ACCENT_PRESETS.map((p) => {
            const active = p.id === accentId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setAccentId(p.id)}
                title={p.label}
                className="group flex flex-col items-center gap-1.5"
              >
                <motion.span
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="relative w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg,${p.accent},${p.accent2})` }}
                >
                  {active && (
                    <motion.span
                      layoutId="accent-swatch-ring"
                      className="absolute -inset-1 rounded-full border-2"
                      style={{ borderColor: p.accent }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {active && <Check size={16} color={p.ink} strokeWidth={3} />}
                </motion.span>
                <span className="text-[10px] text-[var(--text-dim)] group-hover:text-[var(--text)] transition-colors text-center leading-tight">{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live preview so the choice is obvious before navigating away */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--line-04)' }}>
          <button type="button" className="btn-pop text-sm font-semibold px-4 py-2.5 rounded-lg" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', color: 'var(--accent-ink)' }}>
            {t('settings_preview_button')}
          </button>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'rgba(var(--accent-rgb),0.14)', color: 'var(--accent)' }}>
            {t('settings_preview_badge')}
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{t('settings_preview_link')}</span>
        </div>
      </motion.section>

      {/* --- Theme + language --- */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="rounded-2xl border p-5 sm:p-6"
        style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }}
      >
        <h2 className="font-display text-lg font-bold mb-5">{t('settings_general')}</h2>

        <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--line-08)' }}>
          <div>
            <p className="text-sm font-medium">{t('settings_theme_label')}</p>
            <p className="text-xs text-[var(--text-dim)] mt-0.5">{t('settings_theme_desc')}</p>
          </div>
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--line-12)' }}>
            <button
              onClick={() => setTheme('light')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors"
              style={theme === 'light' ? { background: 'var(--accent)', color: 'var(--accent-ink)' } : { color: 'var(--text-dim)' }}
            >
              <Sun size={14} /> {t('settings_theme_light')}
            </button>
            <button
              onClick={() => setTheme('dark')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors"
              style={theme === 'dark' ? { background: 'var(--accent)', color: 'var(--accent-ink)' } : { color: 'var(--text-dim)' }}
            >
              <Moon size={14} /> {t('settings_theme_dark')}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium">{t('settings_language_label')}</p>
            <p className="text-xs text-[var(--text-dim)] mt-0.5">{t('settings_language_desc')}</p>
          </div>
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--line-12)' }}>
            <button
              onClick={() => setLanguage('en')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors"
              style={language === 'en' ? { background: 'var(--accent)', color: 'var(--accent-ink)' } : { color: 'var(--text-dim)' }}
            >
              <Languages size={14} /> EN
            </button>
            <button
              onClick={() => setLanguage('fr')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors"
              style={language === 'fr' ? { background: 'var(--accent)', color: 'var(--accent-ink)' } : { color: 'var(--text-dim)' }}
            >
              <Languages size={14} /> FR
            </button>
          </div>
        </div>
      </motion.section>

      {/* --- Account shortcuts --- */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }}
      >
        <Link to="/profile" className="hover-lift flex items-center justify-between gap-3 px-5 sm:px-6 py-4 hover:bg-white/5 transition-colors border-b" style={{ borderColor: 'var(--line-08)' }}>
          <span className="flex items-center gap-3 text-sm font-medium">
            <User size={17} style={{ color: 'var(--accent)' }} /> {t('settings_edit_profile')}
          </span>
          <ExternalLink size={15} className="text-[var(--text-dim)]" />
        </Link>
        {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
          <Link to="/admin" className="hover-lift flex items-center justify-between gap-3 px-5 sm:px-6 py-4 hover:bg-white/5 transition-colors">
            <span className="flex items-center gap-3 text-sm font-medium">
              <Shield size={17} style={{ color: 'var(--accent)' }} /> {t('settings_organizer_console')}
            </span>
            <ExternalLink size={15} className="text-[var(--text-dim)]" />
          </Link>
        )}
      </motion.section>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'ORGANIZER';
  const Shell = isStaff ? AdminShell : AttendeeShell;
  return (
    <Shell title={t('settings_title')} subtitle={t('settings_subtitle')}>
      <SettingsContent />
    </Shell>
  );
}
