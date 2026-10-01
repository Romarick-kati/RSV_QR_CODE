// Real Mobile Money payment verification via Fapshi (fapshi.com) — the
// active payment provider (see rsvp.controller.js). CamPay's client
// (utils/campay.js) is kept dormant alongside this in case of a future
// switch back; only one provider is actually wired into the RSVP flow at
// a time.
//
// Required environment variables (set in Netlify — never commit these):
//   FAPSHI_API_USER   — from Fapshi dashboard → Developer → API keys
//   FAPSHI_API_KEY     — same page. Its prefix tells us the environment:
//                         "FAK_TEST_..." = sandbox, anything else = live.
//                         No separate FAPSHI_ENV variable needed — Fapshi's
//                         own key format already encodes this, and trusting
//                         that (rather than a second, easy-to-forget env
//                         var) means there's no way for the key and the
//                         environment setting to accidentally disagree.
//
// Until FAPSHI_API_USER/FAPSHI_API_KEY are set, every function below throws
// a clear configuration error rather than silently pretending to succeed —
// payment verification is exactly the kind of thing that must never fail
// open.

const API_USER = process.env.FAPSHI_API_USER;
const API_KEY = process.env.FAPSHI_API_KEY;

const BASE_URL = API_KEY?.startsWith('FAK_TEST_')
  ? 'https://sandbox.fapshi.com'
  : 'https://live.fapshi.com';

function assertConfigured() {
  if (!API_USER || !API_KEY) {
    throw new Error(
      'Fapshi is not configured — set FAPSHI_API_USER and FAPSHI_API_KEY in your environment variables.'
    );
  }
}

function authHeaders() {
  return {
    apiuser: API_USER,
    apikey: API_KEY,
    'Content-Type': 'application/json',
  };
}

/**
 * Creates a Fapshi-hosted checkout link. The attendee is redirected there
 * to enter their own MTN/Orange Money number and complete payment — unlike
 * CamPay's collect API, nothing happens on their phone until they actually
 * visit this link. Fapshi's `direct-pay` endpoint (charge a number
 * directly, no redirect) exists too, but is blocked by default in live
 * mode until Fapshi support manually activates it per account — the
 * hosted-checkout flow here works immediately with zero extra approval,
 * which is the whole reason to prefer Fapshi when you want something
 * simple to get running today.
 */
export async function initiatePay({ amount, email, externalReference, redirectUrl, userId, message }) {
  assertConfigured();
  // Fapshi's minimum chargeable amount is 100 (XAF has no subdivisions in
  // practice, so this is just "100 FCFA", not cents).
  const roundedAmount = Math.max(100, Math.round(amount));
  const res = await fetch(`${BASE_URL}/initiate-pay`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      amount: roundedAmount,
      email,
      redirectUrl,
      userId,
      externalId: externalReference,
      message: message?.slice(0, 100),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || `Fapshi initiate-pay failed (HTTP ${res.status}).`);
    throw err;
  }
  return data; // { message, link, transId, dateInitiated }
}

/**
 * The only source of truth for "did this actually get paid" — always calls
 * Fapshi directly rather than trusting any client-supplied or webhook-
 * supplied status, so a forged/replayed webhook call can't fake a payment.
 */
export async function getPaymentStatus(transId) {
  assertConfigured();
  const res = await fetch(`${BASE_URL}/payment-status/${encodeURIComponent(transId)}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || `Fapshi status check failed (HTTP ${res.status}).`);
  }
  return data; // { transId, status: 'PENDING'|'SUCCESSFUL'|'FAILED'|'EXPIRED', amount, revenue, payerName, email, externalId, financialTransId, dateInitiated, dateConfirmed, ... }
}

export const isFapshiConfigured = () => Boolean(API_USER && API_KEY);
