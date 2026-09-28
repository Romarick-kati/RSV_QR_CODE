// Turns whatever an organizer pastes into { latitude, longitude }.
// Accepts: "4.0511, 9.7679", or a full Google Maps link (the pin from
// "Share" → copy link, or the address bar while a place is open). Short
// links (maps.app.goo.gl, goo.gl/maps) hide the coordinates behind a
// redirect a browser page can't follow, so those get a clear message.
const inRange = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
const pair = (a, b) => {
  const latitude = Number(a);
  const longitude = Number(b);
  return inRange(latitude, longitude) ? { latitude, longitude } : null;
};

export function parseMapLocation(input) {
  const s = String(input || '').trim();
  if (!s) return { empty: true };

  if (/(maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(s)) {
    return { error: 'That is a shortened link. Open it, then copy the long address from the browser bar — or paste the coordinates instead.' };
  }

  const plain = s.match(/^\(?\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*\)?$/);
  if (plain) {
    const r = pair(plain[1], plain[2]);
    if (r) return r;
  }

  let decoded = s;
  try { decoded = decodeURIComponent(s); } catch { /* keep raw */ }
  const patterns = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // the exact pin in a Google place link
    /[?&](?:q|ll|query|destination|center)=(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/,
    /@(-?\d+\.\d+),(-?\d+\.\d+)/, // the map's centre point
  ];
  for (const rx of patterns) {
    const m = decoded.match(rx);
    if (m) {
      const r = pair(m[1], m[2]);
      if (r) return r;
    }
  }
  return { error: 'Could not find coordinates. Paste a Google Maps link or "latitude, longitude" (e.g. 4.0511, 9.7679).' };
}

export function formatCoords(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return '';
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}
