// Runs after `vite build`. The site is a single-page app, so every URL used to
// be served the SAME index.html — meaning Google's first look at /founder or
// /about showed the homepage's title and description until it got around to
// running the JavaScript. This writes a real index.html for each public page
// with its own title, description, canonical URL and social tags baked in, so
// the correct info is there from the very first byte. Netlify serves an
// existing file before the SPA fallback rule, and React still takes over in
// the browser exactly as before.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE = 'https://presencescan.site';

const pages = [
  {
    path: '/events',
    title: 'Browse Events · Presence Scan',
    description: 'Browse upcoming conferences, workshops, seminars, career fairs and community events. RSVP online and get your QR pass instantly.',
    h1: 'Browse upcoming events',
    p: 'Find conferences, workshops, seminars and community events, RSVP online and get a digital QR pass.',
  },
  {
    path: '/discover',
    title: 'Discover Events by Category · Presence Scan',
    description: 'Browse upcoming events by category — technology, community, career, workshops, and more.',
    h1: 'Discover events by category',
    p: 'Explore technology, community, career, workshop and cultural events on Presence.',
  },
  {
    path: '/about',
    title: 'About Presence · QR Event Registration Platform',
    description: 'Presence replaces paper sign-in sheets with online RSVPs, digital QR passes, and one verified scan at check-in. Built by Ndi Romarick Kati.',
    h1: 'About Presence',
    p: 'Presence replaces paper sign-in sheets with online RSVPs, digital QR passes, and one verified scan at check-in.',
  },
  {
    path: '/founder',
    title: 'Ndi Romarick Kati — Founder & Builder of Presence',
    description: 'Ndi Romarick Kati is the founder and builder of Presence (presencescan.site), a QR-powered event registration, check-in, and attendance management platform.',
    h1: 'Ndi Romarick Kati, founder and builder of Presence',
    p: 'Ndi Romarick Kati is a full-stack developer who founded and built Presence, a QR-based event registration and attendance platform.',
  },
  {
    path: '/faq',
    title: 'FAQ · Presence Scan',
    description: 'Answers to common questions about registering for events, digital QR passes, and how check-in works on Presence.',
    h1: 'Frequently asked questions',
    p: 'Answers about registering for events, digital QR passes and how check-in works.',
  },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const template = readFileSync(join(dist, 'index.html'), 'utf8');

function setTag(html, regex, replacement) {
  if (!regex.test(html)) throw new Error(`prerender: template is missing ${regex}`);
  return html.replace(regex, replacement);
}

for (const page of pages) {
  const url = `${SITE}${page.path}`;
  let html = template;
  html = setTag(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`);
  html = setTag(html, /<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${esc(page.description)}" />`);
  html = setTag(html, /<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${url}" />`);
  html = setTag(html, /<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${esc(page.title)}" />`);
  html = setTag(html, /<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${esc(page.description)}" />`);
  html = setTag(html, /<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${url}" />`);
  html = setTag(html, /<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${esc(page.title)}" />`);
  html = setTag(html, /<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${esc(page.description)}" />`);
  html = setTag(html, /<h1>[\s\S]*?<\/h1>\s*<p>[\s\S]*?<\/p>/, `<h1>${esc(page.h1)}</h1>\n        <p>${esc(page.p)}</p>`);

  const dir = join(dist, page.path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  console.log(`prerendered ${page.path}`);
}
