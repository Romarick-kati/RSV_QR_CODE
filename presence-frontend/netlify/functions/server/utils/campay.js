// Real Mobile Money payment verification via CamPay (campay.net), replacing
// the old "type in any text and an organizer clicks confirm" honor system.
//
// Required environment variables (set in Netlify — never commit these):
//   CAMPAY_PERMANENT_TOKEN   — from CamPay dashboard → your app → API ACCESS KEYS
//   CAMPAY_ENV               — 'sandbox' (default) or 'production'. Sandbox
//                               caps real transactions at 100 FCFA, useful
//                               for testing the full flow safely before
//                               clicking "Go Live" in the CamPay dashboard.
//
// Until CAMPAY_PERMANENT_TOKEN is set, every function below throws a clear
// configuration error rather than silently pretending to succeed — payment
// verification is exactly the kind of thing that must never fail open.

const BASE_URL = process.env.CAMPAY_ENV === 'production'
  ? 'https://www.campay.net/api'
  : 'https://demo.campay.net/api';

const TOKEN = process.env.CAMPAY_PERMANENT_TOKEN;

function assertConfigured() {
  if (!TOKEN) {
    throw new Error(
      'CamPay is not configured — set CAMPAY_PERMANENT_TOKEN in your environment variables.'
    );
  }
}

function authHeaders() {
  return {
    Authorization: `Token ${TOKEN}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Cameroon phone numbers must be sent with the 237 country code and no
 * leading +, spaces, or 0 (e.g. "237677123456"). Accepts common local
 * formats a user might type (with/without +237, with/without a leading 0)
 * and normalizes them.
 */
export function normalizeCameroonPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('237')) return digits;
  if (digits.startsWith('0')) return `237${digits.slice(1)}`;
  if (digits.length === 9) return `237${digits}`;
  return digits;
}

/**
 * Kicks off a real Mobile Money payment: the attendee's phone gets an
 * MTN/Orange PIN prompt to approve. Returns immediately with a `reference`
 * (status starts PENDING) — the caller polls getTransactionStatus() with
 * that reference, or waits for the webhook, to learn the outcome.
 */
export async function initiateCollect({ amount, phone, description, externalReference }) {
  assertConfigured();
  const res = await fetch(`${BASE_URL}/collect/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      amount: String(Math.round(amount)),
      currency: 'XAF',
      from: normalizeCameroonPhone(phone),
      description: description?.slice(0, 100) || 'Presence event registration',
      external_reference: externalReference,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // CamPay's error payloads use a `message` or `detail` field, and
    // sometimes a `code` like ER101/ER102 (see utils/campay.js header
    // docs / CamPay's error reference) for phone number problems.
    const message = data?.message || data?.detail || `CamPay collect request failed (HTTP ${res.status}).`;
    const err = new Error(message);
    err.campayCode = data?.code;
    throw err;
  }
  return data; // { reference, ussd_code, operator }
}

/**
 * The only source of truth for "did this actually get paid" — always calls
 * CamPay directly rather than trusting any client-supplied or webhook-
 * supplied status, so a forged/replayed webhook call can't fake a payment.
 */
export async function getTransactionStatus(reference) {
  assertConfigured();
  const res = await fetch(`${BASE_URL}/transaction/status/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ reference }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.detail || `CamPay status check failed (HTTP ${res.status}).`);
  }
  return data; // { reference, external_reference, status: 'PENDING'|'SUCCESSFUL'|'FAILED', amount, currency, operator, code, operator_reference }
}

export const isCampayConfigured = () => Boolean(TOKEN);
