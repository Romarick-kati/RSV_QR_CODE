// The QR pass encodes a full URL (not a bare token) so that scanning it
// with an ordinary phone camera app — not just the admin scanner — takes
// the person somewhere useful instead of showing raw gibberish text.

export function buildCheckinUrl(token) {
  return `${window.location.origin}/checkin/${encodeURIComponent(token)}`;
}

// Accepts either a full check-in URL (normal case, from a real Presence
// pass) or a bare token (backwards-compatible with anything already
// printed/saved before this change, and with manual token entry). Returns
// just the token, ready to send to the check-in API.
export function extractCheckinToken(scanned) {
  const text = (scanned || '').trim();
  const match = text.match(/\/checkin\/([^/?#]+)/);
  if (match) {
    try { return decodeURIComponent(match[1]); } catch { return match[1]; }
  }
  return text;
}
