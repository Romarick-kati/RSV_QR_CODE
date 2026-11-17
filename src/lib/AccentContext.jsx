import { createContext, useContext, useEffect, useState } from 'react';

const AccentContext = createContext(null);
const STORAGE_KEY = 'presence_accent';

// A curated set of accent pairs (main color + a secondary for gradients),
// rather than a raw color wheel — every option here is pre-checked to have
// enough contrast against both the light and dark theme backgrounds, so
// picking any of them never produces unreadable text. Each also carries the
// readable ink color to use for text sitting ON TOP of the accent (e.g. a
// solid button) — light accents need dark ink, dark/saturated ones need
// light ink.
export const ACCENT_PRESETS = [
  { id: 'teal', label: 'Teal & Violet', accent: '#22D3A6', accent2: '#8B7CF6', ink: '#04140f' },
  { id: 'sunset', label: 'Sunset', accent: '#F5A623', accent2: '#FF5C77', ink: '#1a1002' },
  { id: 'berry', label: 'Berry', accent: '#FF5C77', accent2: '#8B7CF6', ink: '#1a0509' },
  { id: 'ocean', label: 'Ocean', accent: '#22B8D3', accent2: '#22D3A6', ink: '#031a1c' },
  { id: 'grape', label: 'Grape', accent: '#8B7CF6', accent2: '#22B8D3', ink: '#0e0a1f' },
  { id: 'gold', label: 'Gold', accent: '#F5A623', accent2: '#22D3A6', ink: '#1a1002' },
  { id: 'rose', label: 'Rose Gold', accent: '#FF8FA3', accent2: '#F5A623', ink: '#1a0509' },
  { id: 'forest', label: 'Forest', accent: '#3DDC97', accent2: '#22B8D3', ink: '#04140f' },
];

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return '34,211,166';
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)].join(',');
}

function getInitialAccentId() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ACCENT_PRESETS.some((p) => p.id === stored)) return stored;
  } catch { /* localStorage unavailable */ }
  return 'teal';
}

export function AccentProvider({ children }) {
  const [accentId, setAccentId] = useState(getInitialAccentId);

  useEffect(() => {
    const preset = ACCENT_PRESETS.find((p) => p.id === accentId) || ACCENT_PRESETS[0];
    const root = document.documentElement.style;
    root.setProperty('--accent', preset.accent);
    root.setProperty('--accent-2', preset.accent2);
    root.setProperty('--accent-rgb', hexToRgb(preset.accent));
    root.setProperty('--accent-ink', preset.ink);
    try { localStorage.setItem(STORAGE_KEY, accentId); } catch { /* ignore */ }
  }, [accentId]);

  const preset = ACCENT_PRESETS.find((p) => p.id === accentId) || ACCENT_PRESETS[0];

  return (
    <AccentContext.Provider value={{ accentId, setAccentId, preset, presets: ACCENT_PRESETS }}>
      {children}
    </AccentContext.Provider>
  );
}

export function useAccent() {
  const ctx = useContext(AccentContext);
  if (!ctx) throw new Error('useAccent must be used within AccentProvider');
  return ctx;
}
