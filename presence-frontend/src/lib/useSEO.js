import { useEffect } from 'react';

const SITE_NAME = 'Presence';
const SITE_URL = 'https://scan-point.netlify.app';
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

function setJsonLd(id, data) {
  let tag = document.getElementById(id);
  if (!data) {
    tag?.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.id = id;
    document.head.appendChild(tag);
  }
  tag.textContent = JSON.stringify(data);
}

/**
 * Sets the document title + meta description + canonical URL (and, for
 * private/console pages, a noindex robots tag) for the page it's called
 * from. This is a single-page app served from one static `index.html`, so
 * without this the browser tab, every search-engine result, AND the
 * canonical URL would show the same generic homepage info no matter which
 * page someone lands on — the canonical especially matters, since a wrong
 * or duplicated canonical actively tells Google "don't bother indexing
 * this page separately, it's the same as the homepage".
 *
 * @param {string} title - Page-specific title. Rendered as "Title · Presence".
 * @param {string} [description] - Falls back to the site-wide description.
 * @param {{ noindex?: boolean, path?: string, jsonLd?: object }} [opts] -
 *   `noindex: true` for signed-in/organizer pages that shouldn't show up in
 *   search results. `path` builds the canonical URL (defaults to the
 *   current browser path — pass this explicitly for routes with params,
 *   e.g. `/events/${id}`, so the canonical doesn't accidentally include a
 *   query string or hash). `jsonLd` sets page-specific structured data
 *   (e.g. a Person schema on the founder page) — cleared automatically on
 *   unmount so it doesn't leak onto whatever page is visited next.
 */
export function useSEO(title, description, opts = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME}: Event Registration and QR Attendance`;
    const fullDescription = description || DEFAULT_DESCRIPTION;
    const canonicalPath = opts.path ?? window.location.pathname;
    const canonicalUrl = `${SITE_URL}${canonicalPath === '/' ? '' : canonicalPath}`;

    document.title = fullTitle;
    setMeta('description', fullDescription);
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', fullDescription, 'property');
    setMeta('og:url', canonicalUrl, 'property');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', fullDescription);

    let canonicalTag = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', canonicalUrl);

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

    setJsonLd('page-jsonld', opts.jsonLd || null);
    return () => setJsonLd('page-jsonld', null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, opts.noindex, opts.path, JSON.stringify(opts.jsonLd)]);
}

export { SITE_NAME, SITE_URL };
