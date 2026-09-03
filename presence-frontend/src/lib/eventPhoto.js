// "Auto-assign a photo from the event name" feature.
//
// How it works: the event title is scanned for theme keywords (hackathon,
// wedding, concert, graduation, career fair, etc.) and matched to a themed,
// locally-generated gradient placeholder — an inline SVG data URI, so it
// renders instantly with zero network requests and can never fail to load,
// get blocked, or hang (unlike a third-party image CDN).
//
// If you later add a free Unsplash API key (unsplash.com/developers) and set
// VITE_UNSPLASH_ACCESS_KEY in your .env / Netlify environment variables,
// suggestEventPhoto() will instead pull a real, content-matched photo for
// the exact event title from Unsplash's search API — genuinely smarter, but
// entirely optional. Without a key, or if the fetch fails/is blocked, the
// app quietly falls back to the local gradient system below.

// Labeled catalog for the "Browse photos" gallery picker in EventForm —
// each theme groups under a human-facing label + icon name (a lucide-react
// icon name, resolved in the component) so the picker can show tabs like
// "Tech", "Food", "Academic" instead of raw theme keys.
export const THEME_CATALOG = [
  { key: 'tech', label: 'Tech', icon: 'Cpu' },
  { key: 'hackathon', label: 'Hackathon', icon: 'Code2' },
  { key: 'workshop', label: 'Workshop', icon: 'Wrench' },
  { key: 'conference', label: 'Conference', icon: 'Presentation' },
  { key: 'academic', label: 'Academic', icon: 'GraduationCap' },
  { key: 'career', label: 'Career', icon: 'Target' },
  { key: 'corporate', label: 'Corporate', icon: 'Briefcase' },
  { key: 'cultural', label: 'Cultural', icon: 'Palette' },
  { key: 'music', label: 'Music', icon: 'Music' },
  { key: 'sports', label: 'Sports', icon: 'Trophy' },
  { key: 'party', label: 'Party', icon: 'PartyPopper' },
  { key: 'wedding', label: 'Wedding', icon: 'Heart' },
  { key: 'health', label: 'Health', icon: 'HeartPulse' },
  { key: 'food', label: 'Food', icon: 'UtensilsCrossed' },
  { key: 'art', label: 'Art & Design', icon: 'Paintbrush' },
  { key: 'seminar', label: 'Seminar', icon: 'Mic' },
];

const THEMES = THEME_CATALOG.map(({ key }) => ({
  key,
  match: {
    hackathon: ['hackathon', 'hack-a-thon', 'coding challenge', 'devfest'],
    tech: ['tech', 'technology', 'software', 'ai', 'coding', 'developer', 'innovation', 'startup', 'robotics', 'engineering'],
    workshop: ['workshop', 'bootcamp', 'training', 'masterclass', 'hands-on'],
    conference: ['conference', 'summit', 'symposium', 'convention'],
    academic: ['lecture', 'academic', 'graduation', 'convocation', 'thesis', 'research', 'university', 'faculty'],
    career: ['career', 'job fair', 'internship', 'recruit', 'hiring'],
    corporate: ['corporate', 'business', 'networking', 'meeting', 'leadership'],
    cultural: ['cultural', 'festival', 'heritage', 'traditional', 'exhibition'],
    music: ['concert', 'music', 'band', 'live performance', 'gig'],
    sports: ['sports', 'tournament', 'match', 'athletics', 'football', 'basketball'],
    party: ['party', 'celebration', 'gala', 'anniversary', 'ceremony'],
    wedding: ['wedding', 'bridal'],
    health: ['health', 'medical', 'wellness', 'clinic', 'hospital'],
    food: ['food', 'cuisine', 'culinary', 'cooking', 'tasting'],
    art: ['art', 'design', 'creative', 'gallery', 'photography'],
    seminar: ['seminar', 'panel', 'talk', 'discussion'],
  }[key] || [],
}));

// Two-color gradient per theme, echoing the same palette used for the
// category tint overlays (EVENT_TINTS in lib/constants.js) so the
// generated placeholder and the overlay always feel like one design.
const THEME_GRADIENTS = {
  hackathon: ['#1C2B6B', '#22D3A6'], tech: ['#1C2B6B', '#22D3A6'],
  workshop: ['#3A1730', '#FF5C77'], conference: ['#1A2340', '#F5A623'],
  academic: ['#2C1F5E', '#8B7CF6'], career: ['#2A1C3D', '#8B7CF6'],
  corporate: ['#1A2340', '#F5A623'], cultural: ['#3D1C1C', '#F5A623'],
  music: ['#3A1730', '#FF5C77'], sports: ['#1C2B6B', '#22D3A6'],
  party: ['#3D1C1C', '#F5A623'], wedding: ['#2C1F5E', '#8B7CF6'],
  health: ['#152A2E', '#22D3A6'], food: ['#3D1C1C', '#F5A623'],
  art: ['#2A1C3D', '#8B7CF6'], seminar: ['#152A2E', '#22D3A6'],
};

const CATEGORY_FALLBACK_THEME = {
  Technology: 'tech', Academic: 'academic', Corporate: 'corporate', Workshop: 'workshop',
  Seminar: 'seminar', Career: 'career', Cultural: 'cultural',
};

function detectTheme(title = '', category = '') {
  const text = title.toLowerCase();
  for (const theme of THEMES) {
    if (theme.match.some((kw) => text.includes(kw))) return theme.key;
  }
  return CATEGORY_FALLBACK_THEME[category] || 'tech';
}

// Deterministic pseudo-random 0-1 float from a string — used to vary
// pattern angle/style/hue per variant so a theme's 8 gallery options look
// meaningfully different from each other, not just re-tints of one image.
function hashUnit(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

function shiftHue([hex1, hex2], degrees) {
  // Cheap hue rotation via CSS filter isn't available on a static data URI,
  // so instead we just blend toward a rotated point on the same two-color
  // gradient family by mixing in the theme's secondary brand tones. This
  // keeps every variant on-brand rather than drifting into unrelated colors.
  return degrees % 40 < 20 ? [hex1, hex2] : [hex2, hex1];
}

function localPlaceholderUrl(theme, variant = 0, w = 900, h = 600) {
  const base = THEME_GRADIENTS[theme] || THEME_GRADIENTS.tech;
  const seed = hashUnit(`${theme}-${variant}`);
  const angle = Math.round(seed * 160); // 0-160deg, varies per variant
  const [c1, c2] = shiftHue(base, angle + variant * 37);
  const patternType = variant % 3; // 0=diagonal lines, 1=dots, 2=grid
  let patternDefs, patternRect;
  if (patternType === 0) {
    patternDefs = `<pattern id="p" width="46" height="46" patternTransform="rotate(${angle})" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="46" stroke="#ffffff" stroke-opacity="0.07" stroke-width="16"/></pattern>`;
  } else if (patternType === 1) {
    const r = 3 + (variant % 4);
    patternDefs = `<pattern id="p" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="17" cy="17" r="${r}" fill="#ffffff" fill-opacity="0.10"/></pattern>`;
  } else {
    patternDefs = `<pattern id="p" width="52" height="52" patternTransform="rotate(${angle})" patternUnits="userSpaceOnUse"><path d="M0 26h52M26 0v52" stroke="#ffffff" stroke-opacity="0.06" stroke-width="2"/></pattern>`;
  }
  patternRect = `<rect width="${w}" height="${h}" fill="url(#p)"/>`;
  const gx2 = 40 + Math.round(seed * 60);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="${gx2}%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
      ${patternDefs}
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    ${patternRect}
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Synchronous — safe to use directly in <img src> while rendering lists. */
export function getSmartEventPhoto(event, dims = '900/600') {
  if (event?.image) return event.image;
  const theme = detectTheme(event?.title, event?.category);
  const [w, h] = dims.split('/').map(Number);
  return localPlaceholderUrl(theme, 0, w, h);
}

/**
 * Powers the "Browse photos" gallery in EventForm: N distinct on-brand
 * variants for a given theme, generated instantly with no network call —
 * always available even with no Unsplash key configured.
 */
export function getThemeGalleryVariants(themeKey, count = 8, dims = '480/300') {
  const [w, h] = dims.split('/').map(Number);
  return Array.from({ length: count }, (_, i) => ({
    id: `${themeKey}-${i}`,
    url: localPlaceholderUrl(themeKey, i, w, h),
  }));
}

/**
 * If VITE_UNSPLASH_ACCESS_KEY is configured, fetch a page of real photos
 * for a theme/query to mix into the gallery alongside the generated
 * variants above. Returns [] (never throws) if unconfigured or the
 * request fails/times out — the gallery works fine either way.
 */
export async function fetchUnsplashGallery(query, count = 8) {
  const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://api.unsplash.com/search/photos?per_page=${count}&orientation=landscape&query=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Client-ID ${key}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.results || []).map((r) => ({ id: r.id, url: r.urls.small, credit: r.user?.name }));
  } catch {
    return [];
  }
}

async function tryUnsplash(query) {
  const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // don't hang the form forever if Unsplash is unreachable
    const res = await fetch(`https://api.unsplash.com/search/photos?per_page=1&orientation=landscape&query=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Client-ID ${key}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.results?.[0]?.urls?.regular || null;
  } catch {
    return null;
  }
}

/**
 * Used by the "Auto-suggest cover photo" button in the admin event form.
 * Tries a real content-matched Unsplash photo first (if configured), then
 * falls back to the local gradient placeholder system above — which never
 * fails, so this function always resolves to a usable image.
 */
export async function suggestEventPhoto(title, category) {
  const query = title?.trim() || category || 'event';
  const live = await tryUnsplash(query);
  if (live) return live;
  const theme = detectTheme(title, category);
  return localPlaceholderUrl(theme, 0);
}
