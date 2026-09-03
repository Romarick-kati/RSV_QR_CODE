import { createContext, useContext, useEffect, useState } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'presence_language';

function getInitialLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'fr') return stored;
  } catch { /* localStorage unavailable */ }
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return nav?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    try { localStorage.setItem(STORAGE_KEY, language); } catch { /* ignore */ }
  }, [language]);

  function toggleLanguage() {
    setLanguage((l) => (l === 'en' ? 'fr' : 'en'));
  }

  // Falls back to the English string, then to the raw key, so a missing
  // translation never breaks the page — it just shows readable English.
  // Optional `vars` fills in {placeholders}, e.g. t('dash_welcome', { name: 'Aisha' }).
  function t(key, vars) {
    let str = translations[language]?.[key] || translations.en[key] || key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{${k}}`, v);
      }
    }
    return str;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
