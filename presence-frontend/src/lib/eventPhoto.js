// "Auto-assign a photo from the event name" feature.
//
// How it works: the event title is scanned for theme keywords (hackathon,
// wedding, concert, graduation, career fair, etc.) and matched to a stable,
// keyless placeholder photo for that theme (via Lorem Picsum, seeded so the
// same theme always gets the same photo). This needs zero configuration and
// keeps working forever on any host — no API key to expire, no rate limit.
//
// If you later add a free Unsplash API key (unsplash.com/developers) and set
// VITE_UNSPLASH_ACCESS_KEY in your .env / Netlify environment variables,
// suggestEventPhoto() will instead pull a real, content-matched photo for
// the exact event title from Unsplash's search API — genuinely smarter, but
// entirely optional. Without a key, the app quietly falls back to the
// keyword system below, so nothing breaks either way.

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

// One stable Picsum seed per theme, plus a fallback per category so an
// unmatched title still gets something sensible rather than totally random.
const THEME_SEEDS = {
  hackathon: 'presence-hackathon', tech: 'presence-technology', workshop: 'presence-workshop',
  conference: 'presence-conference', academic: 'presence-academic', career: 'presence-career',
  corporate: 'presence-corporate', cultural: 'presence-cultural', music: 'presence-music',
  sports: 'presence-sports', party: 'presence-party', wedding: 'presence-wedding',
  health: 'presence-health', food: 'presence-food', art: 'presence-art', seminar: 'presence-seminar',
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

function seedPhotoUrl(theme, dims = '900/600') {
  const seed = THEME_SEEDS[theme] || THEME_SEEDS.tech;
  return `https://picsum.photos/seed/${seed}/${dims}`;
}

/** Synchronous — safe to use directly in <img src> while rendering lists. */
export function getSmartEventPhoto(event, dims = '900/600') {
  if (event?.image) return event.image;
  const theme = detectTheme(event?.title, event?.category);
  return seedPhotoUrl(theme, dims);
}

async function tryUnsplash(query) {
  const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://api.unsplash.com/search/photos?per_page=1&orientation=landscape&query=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Client-ID ${key}` },
    });
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
 * falls back to the keyword→theme placeholder system above.
 */
export async function suggestEventPhoto(title, category) {
  const query = title?.trim() || category || 'event';
  const live = await tryUnsplash(query);
  if (live) return live;
  const theme = detectTheme(title, category);
  return seedPhotoUrl(theme);
}
