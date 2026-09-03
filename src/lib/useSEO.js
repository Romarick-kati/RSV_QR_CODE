import { useEffect } from 'react';

const SITE_NAME = 'Presence';
const DEFAULT_DESCRIPTION =
  'Presence is an event registration and QR-based attendance tracking platform. RSVP online, receive a digital pass, and check in with a single verified scan.';

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let tag = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * Sets the document title + meta description (and, for private/console
 * pages, a noindex robots tag) for the page it's called from. This is a
 * single-page app served from one static `index.html`, so without this the
 * browser tab and every search-engine result would show the same generic
 * title no matter which page someone lands on.
 *
 * @param {string} title - Page-specific title. Rendered as "Title · Presence".
 * @param {string} [description] - Falls back to the site-wide description.
 * @param {{ noindex?: boolean }} [opts] - Pass `noindex: true` for
 *   signed-in/organizer pages that shouldn't show up in search results.
 */
export function useSEO(title, description, opts = {}) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME}: Event Registration and QR Attendance`;
    setMeta('description', description || DEFAULT_DESCRIPTION);
    setMeta('og:title', title ? `${title} · ${SITE_NAME}` : SITE_NAME, 'property');
    setMeta('og:description', description || DEFAULT_DESCRIPTION, 'property');

    let robotsTag = document.head.querySelector('meta[name="robots"]');
    if (opts.noindex) {
      if (!robotsTag) {
        robotsTag = document.createElement('meta');
        robotsTag.setAttribute('name', 'robots');
        document.head.appendChild(robotsTag);
      }
      robotsTag.setAttribute('content', 'noindex, nofollow');
    } else if (robotsTag) {
      robotsTag.remove();
    }
  }, [title, description, opts.noindex]);
}
