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

const THEMES = [
  { key: 'hackathon', match: ['hackathon', 'hack-a-thon', 'coding challenge', 'devfest'] },
  { key: 'tech', match: ['tech', 'technology', 'software', 'ai', 'coding', 'developer', 'innovation', 'startup', 'robotics', 'engineering'] },
  { key: 'workshop', match: ['workshop', 'bootcamp', 'training', 'masterclass', 'hands-on'] },
  { key: 'conference', match: ['conference', 'summit', 'symposium', 'convention'] },
  { key: 'academic', match: ['lecture', 'academic', 'graduation', 'convocation', 'thesis', 'research', 'university', 'faculty'] },
  { key: 'career', match: ['career', 'job fair', 'internship', 'recruit', 'hiring'] },
  { key: 'corporate', match: ['corporate', 'business', 'networking', 'meeting', 'leadership'] },
  { key: 'cultural', match: ['cultural', 'festival', 'heritage', 'traditional', 'exhibition'] },
  { key: 'music', match: ['concert', 'music', 'band', 'live performance', 'gig'] },
  { key: 'sports', match: ['sports', 'tournament', 'match', 'athletics', 'football', 'basketball'] },
  { key: 'party', match: ['party', 'celebration', 'gala', 'anniversary', 'ceremony'] },
  { key: 'wedding', match: ['wedding', 'bridal'] },
  { key: 'health', match: ['health', 'medical', 'wellness', 'clinic', 'hospital'] },
  { key: 'food', match: ['food', 'cuisine', 'culinary', 'cooking', 'tasting'] },
  { key: 'art', match: ['art', 'design', 'creative', 'gallery', 'photography'] },
  { key: 'seminar', match: ['seminar', 'panel', 'talk', 'discussion'] },
];

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

// Deterministic pseudo-random offset (0-1) from a string, purely to vary
// the diagonal-line pattern's position per theme so placeholders don't
// all look identical — not used for anything security-sensitive.
function hashUnit(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

function localPlaceholderUrl(theme, w = 900, h = 600) {
  const [c1, c2] = THEME_GRADIENTS[theme] || THEME_GRADIENTS.tech;
  const offset = hashUnit(theme);
  const angle = 24 + Math.round(offset * 20); // 24-44deg, varies per theme
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
      <pattern id="lines" width="46" height="46" patternTransform="rotate(${angle})" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="46" stroke="#ffffff" stroke-opacity="0.06" stroke-width="18"/>
      </pattern>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <rect width="${w}" height="${h}" fill="url(#lines)"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Synchronous — safe to use directly in <img src> while rendering lists. */
export function getSmartEventPhoto(event, dims = '900/600') {
  if (event?.image) return event.image;
  const theme = detectTheme(event?.title, event?.category);
  const [w, h] = dims.split('/').map(Number);
  return localPlaceholderUrl(theme, w, h);
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
  return localPlaceholderUrl(theme);
}
