import crypto from 'crypto';

// Human-readable reference shown on the pass/UI (not secret).
export function generateReference() {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `PRES-${year}-${random}`;
}

// The token embedded in the QR code. It must be unguessable — this is the
// only thing the QR code carries, so its entropy is what keeps check-in
// secure. 32 random bytes, base64url-encoded, is not brute-forceable.
export function generateAttendanceToken() {
  return 'tok_' + crypto.randomBytes(24).toString('base64url');
}
