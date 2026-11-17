// Turns the site's generic index.html into an event-specific page: its own
// title, description, canonical link, share image and schema.org/Event data,
// all present in the HTML itself. Google and WhatsApp read that raw HTML
// without running the app, so a new event can be found and previewed from
// its very first request instead of looking like the homepage.
export const SITE = 'https://presencescan.site';

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Replacement is passed as a function so characters like "$" in an event
// title (for example "$50 workshop") are never treated as special patterns.
function swap(html, regex, replacement) {
  return html.replace(regex, () => replacement);
}

function dayOf(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function longDate(date) {
  try {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${dayOf(date)}T00:00:00Z`));
  } catch {
    return dayOf(date);
  }
}

// "+01:00" style offset for an IANA zone on a given day, so search engines
// know the exact moment the event starts. Falls back to no offset.
function offsetFor(timezone, day) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'longOffset' }).formatToParts(new Date(`${day}T12:00:00Z`));
    const raw = parts.find((p) => p.type === 'timeZoneName')?.value || '';
    const m = raw.match(/GMT([+-]\d{2}:\d{2})/);
    return m ? m[1] : raw === 'GMT' ? '+00:00' : '';
  } catch {
    return '';
  }
}

function clip(text, max) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

export function buildEventHead(event, id) {
  const day = dayOf(event.date);
  const offset = offsetFor(event.timezone || 'Africa/Douala', day);
  const url = `${SITE}/events/${id}`;
  const online = event.format === 'online';
  const hasPin = Number.isFinite(event.latitude) && Number.isFinite(event.longitude);
  const image = event.image && /^https?:\/\//.test(event.image) ? event.image : null;
  const organizerName = event.organizer?.name || null;

  const where = online ? 'online' : event.venue;
  const title = `${clip(event.title, 60)} · Presence Scan`;
  const description = clip(`${event.title} on ${longDate(event.date)}${where ? ` · ${where}` : ''}. ${event.description || 'Register on Presence and get your QR pass.'}`, 158);

  const location = online
    ? { '@type': 'VirtualLocation', url }
    : {
        '@type': 'Place',
        name: event.venue,
        address: event.venue,
        ...(hasPin ? { geo: { '@type': 'GeoCoordinates', latitude: event.latitude, longitude: event.longitude } } : {}),
      };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: clip(event.description, 500),
    startDate: `${day}T${event.startTime}${offset}`,
    endDate: `${day}T${event.endTime}${offset}`,
    eventStatus: event.status === 'cancelled' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: online
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : event.format === 'hybrid'
        ? 'https://schema.org/MixedEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode',
    location,
    ...(image ? { image: [image] } : {}),
    organizer: { '@type': organizerName ? 'Person' : 'Organization', name: organizerName || 'Presence', url: SITE },
    offers: {
      '@type': 'Offer',
      url,
      price: String(event.price || 0),
      priceCurrency: 'XAF',
      availability: 'https://schema.org/InStock',
    },
    url,
  };

  return { title, description, url, image: image || `${SITE}/og-image.png`, hasOwnImage: !!image, jsonLd, heading: event.title };
}

export function injectEventHead(shell, head) {
  let html = shell;
  html = swap(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(head.title)}</title>`);
  html = swap(html, /<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${esc(head.description)}" />`);
  html = swap(html, /<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${head.url}" />`);
  html = swap(html, /<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${esc(head.title)}" />`);
  html = swap(html, /<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${esc(head.description)}" />`);
  html = swap(html, /<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${head.url}" />`);
  html = swap(html, /<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${esc(head.image)}" />`);
  html = swap(html, /<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${esc(head.title)}" />`);
  html = swap(html, /<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${esc(head.description)}" />`);
  html = swap(html, /<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${esc(head.image)}" />`);
  if (head.hasOwnImage) {
    // The brand image is 1200x630; an organizer's own photo has other
    // dimensions, so drop the fixed size hints rather than state wrong ones.
    html = swap(html, /\s*<meta property="og:image:width" content="[^"]*"\s*\/>/, '');
    html = swap(html, /\s*<meta property="og:image:height" content="[^"]*"\s*\/>/, '');
  }
  html = swap(html, /<meta property="og:image:alt" content="[^"]*"\s*\/>/, `<meta property="og:image:alt" content="${esc(head.heading)}" />`);
  html = swap(html, /<h1>[\s\S]*?<\/h1>\s*<p>[\s\S]*?<\/p>/, `<h1>${esc(head.heading)}</h1>\n        <p>${esc(head.description)}</p>`);
  const ld = JSON.stringify(head.jsonLd).replace(/</g, '\\u003c');
  return swap(html, /<\/head>/, `    <script type="application/ld+json" id="event-jsonld">${ld}</script>\n  </head>`);
}

// Pages that must not be indexed (unknown id, draft): keep the normal app
// shell but tell search engines to skip it, without exposing any event data.
export function injectNoindex(shell) {
  return swap(shell, /<\/head>/, '    <meta name="robots" content="noindex, nofollow" />\n  </head>');
}
