import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, Loader2, Cpu, Code2, Wrench, Presentation, GraduationCap, Target,
  Briefcase, Palette, Music, Trophy, PartyPopper, Heart, HeartPulse, UtensilsCrossed,
  Paintbrush, Mic, Image as ImageIcon,
} from 'lucide-react';
import { THEME_CATALOG, getThemeGalleryVariants, fetchUnsplashGallery } from '../../lib/eventPhoto';

// Explicit map instead of `import * as Icons from 'lucide-react'` — a
// wildcard import pulls the ENTIRE icon library (1000+ icons) into this
// bundle, ballooning it from a few KB to 600+ KB. Only importing the
// handful actually used keeps this component's chunk small.
const ICONS = {
  Cpu, Code2, Wrench, Presentation, GraduationCap, Target, Briefcase, Palette,
  Music, Trophy, PartyPopper, Heart, HeartPulse, UtensilsCrossed, Paintbrush, Mic,
};

export default function PhotoGalleryPicker({ open, onClose, onSelect, initialTheme }) {
  const [activeTheme, setActiveTheme] = useState(initialTheme || 'tech');
  const [unsplashPhotos, setUnsplashPhotos] = useState([]);
  const [loadingUnsplash, setLoadingUnsplash] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActiveTheme(initialTheme || 'tech');
  }, [open, initialTheme]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingUnsplash(true);
    const label = THEME_CATALOG.find((t) => t.key === activeTheme)?.label || activeTheme;
    fetchUnsplashGallery(label, 6).then((photos) => {
      if (!cancelled) { setUnsplashPhotos(photos); setLoadingUnsplash(false); }
    });
    return () => { cancelled = true; };
  }, [open, activeTheme]);

  if (!open) return null;

  const generated = getThemeGalleryVariants(activeTheme, 8);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-black/70" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        <motion.div
          className="relative w-full sm:max-w-2xl max-h-[85vh] rounded-t-2xl sm:rounded-2xl border overflow-hidden flex flex-col"
          style={{ borderColor: 'var(--line-10)', background: 'var(--panel)' }}
          initial={{ y: 40, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--line-08)' }}>
            <h3 className="font-display font-bold text-base">Browse cover photos</h3>
            <button onClick={onClose} className="text-[var(--text-dim)] hover:text-[var(--text)]"><X size={20} /></button>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1.5 px-4 py-3 overflow-x-auto shrink-0 border-b" style={{ borderColor: 'var(--line-08)' }}>
            {THEME_CATALOG.map((theme) => {
              const IconComp = ICONS[theme.icon] || ImageIcon;
              const active = theme.key === activeTheme;
              return (
                <button
                  key={theme.key}
                  onClick={() => setActiveTheme(theme.key)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0"
                  style={active ? { background: 'var(--accent)', color: 'var(--accent-ink)' } : { color: 'var(--text-dim)', background: 'var(--line-04)' }}
                >
                  <IconComp size={13} /> {theme.label}
                </button>
              );
            })}
          </div>

          {/* Photo grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingUnsplash && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-3">
                <Loader2 size={13} className="animate-spin" /> Looking for real photos too…
              </div>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {unsplashPhotos.map((p) => (
                <PhotoTile key={p.id} url={p.url} onClick={() => onSelect(p.url)} />
              ))}
              {generated.map((p) => (
                <PhotoTile key={p.id} url={p.url} onClick={() => onSelect(p.url)} />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PhotoTile({ url, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className="group relative aspect-[3/2] rounded-lg overflow-hidden border"
      style={{ borderColor: 'var(--line-10)' }}
    >
      <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
      <span className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--accent)' }}>
          <Check size={14} color="var(--accent-ink)" />
        </span>
      </span>
    </motion.button>
  );
}
