// Serves /events/:id with that event's own title, description, image and
// schema.org data already in the HTML (see server/utils/eventPage.js for why).
// The visitor still gets the normal app: this only fills in the page's <head>.
// If anything goes wrong it falls back to the plain app shell, so an event
// page can never break because of this function.
import { connectDB, mongoose } from './server/config/db.js';
import Event from './server/models/Event.js';
import './server/models/User.js'; // registers the model that populate('organizer') needs
import { buildEventHead, injectEventHead, injectNoindex, SITE } from './server/utils/eventPage.js';

let shellCache = { html: null, at: 0 };
const SHELL_TTL_MS = 10 * 60 * 1000;

async function getShell() {
  if (shellCache.html && Date.now() - shellCache.at < SHELL_TTL_MS) return shellCache.html;
  const base = process.env.URL || SITE;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(`${base}/index.html`, { redirect: 'follow' });
      if (res.ok) {
        const html = await res.text();
        if (html.includes('<div id="root">')) {
          shellCache = { html, at: Date.now() };
          return html;
        }
      }
    } catch (err) {
      console.error('[event-page] shell fetch failed:', err.message);
    }
  }
  return null;
}

const HTML = { 'Content-Type': 'text/html; charset=utf-8' };

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const shell = await getShell();
  if (!shell) {
    // Could not read the app shell: send people to the events list rather
    // than a blank page.
    return { statusCode: 302, headers: { Location: '/events', 'Cache-Control': 'no-store' } };
  }

  const id = event.queryStringParameters?.id;
  if (!id || !mongoose.isValidObjectId(id)) {
    return { statusCode: 404, headers: { ...HTML, 'Cache-Control': 'no-store' }, body: injectNoindex(shell) };
  }

  let doc;
  try {
    await connectDB();
    doc = await Event.findById(id).populate('organizer', 'name').lean();
  } catch (err) {
    // Database trouble: serve the plain app so the page still works.
    console.error('[event-page] lookup failed:', err.message);
    return { statusCode: 200, headers: { ...HTML, 'Cache-Control': 'no-store' }, body: shell };
  }

  if (!doc) return { statusCode: 404, headers: { ...HTML, 'Cache-Control': 'no-store' }, body: injectNoindex(shell) };
  if (doc.status === 'draft') return { statusCode: 200, headers: { ...HTML, 'Cache-Control': 'no-store' }, body: injectNoindex(shell) };

  const body = injectEventHead(shell, buildEventHead(doc, id));
  return {
    statusCode: 200,
    headers: {
      ...HTML,
      'Cache-Control': 'public, max-age=0, must-revalidate',
      // Netlify's CDN may keep this for 5 minutes (and serve it while it
      // refreshes), which cuts server calls when many people open one event.
      'Netlify-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
    body,
  };
};
