import Event from '../models/Event.js';

const SITE_URL = 'https://presencescan.site';

// Static pages first, then every published event — regenerated on each
// request (cached for an hour), so a newly published event appears in the
// sitemap without anyone editing a file or redeploying. If the events query
// fails, the static pages are still returned rather than an error, so
// Google never sees a broken sitemap.
const STATIC_PAGES = [
  { path: '/', priority: '1.0', images: ['/icon-512.png', '/og-image.png', '/paper-sign-in-sheet.svg'] },
  { path: '/events', priority: '0.9' },
  { path: '/discover', priority: '0.7' },
  { path: '/about', priority: '0.7', images: ['/icon-512.png'] },
  { path: '/founder', priority: '0.8', images: ['/creator.jpg'] },
  { path: '/faq', priority: '0.6' },
  { path: '/privacy', priority: '0.3' },
  { path: '/terms', priority: '0.3' },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const day = (d) => new Date(d).toISOString().slice(0, 10);

export async function sitemap(req, res) {
  const today = day(new Date());
  let events = [];
  try {
    events = await Event.find({ status: 'published' }).select('_id updatedAt image').sort({ date: -1 }).limit(1000).lean();
  } catch (err) {
    console.error('sitemap: could not load events', err.message);
  }

  const staticXml = STATIC_PAGES.map((p) => {
    const imgs = (p.images || []).map((i) => `<image:image><image:loc>${SITE_URL}${i}</image:loc></image:image>`).join('');
    return `  <url><loc>${SITE_URL}${p.path === '/' ? '/' : p.path}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority>${imgs}</url>`;
  });
  const eventXml = events.map((e) =>
    `  <url><loc>${SITE_URL}/events/${esc(e._id)}</loc><lastmod>${day(e.updatedAt || new Date())}</lastmod><priority>0.8</priority></url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[...staticXml, ...eventXml].join('\n')}
</urlset>
`;
  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(xml);
}
