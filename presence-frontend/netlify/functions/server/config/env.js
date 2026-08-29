import 'dotenv/config';

const REQUIRED = ['MONGODB_URI', 'JWT_SECRET'];

// Deliberately does NOT exit the process here — this file is imported by
// both the standalone server (server.js) and the Netlify Function
// (netlify/functions/api.js). A `process.exit(1)` at import time is fine
// for the former but catastrophic for the latter: it kills the Lambda
// during cold start, before Express or its error handler ever runs, so the
// client gets a bare platform-level error with no JSON `message` field —
// which is exactly what silently produces a generic, undiagnosable
// "Something went wrong" in the frontend instead of a clear explanation.
// Callers decide what to do with the thrown error (server.js exits loudly;
// the Netlify function returns a proper JSON 500 explaining exactly what's
// missing and where to set it).
export function assertRequiredEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
      `Locally: copy .env.example to .env and fill them in. On Netlify: ` +
      `Site configuration → Environment variables (make sure they're enabled ` +
      `for the "Functions" scope), then trigger a new deploy.`
    );
  }
}

// CORS_ORIGIN accepts a single origin or a comma-separated list, so one
// deployment can serve both local dev and a real domain without code changes.
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const config = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: corsOrigins[0],
  corsOrigins,
  // Optional — "Sign in with Google" is disabled gracefully (frontend hides
  // the button, backend rejects the route with a clear message) if unset,
  // rather than crashing the whole server over an optional feature.
  googleClientId: process.env.GOOGLE_CLIENT_ID || null,

  // The one admin account, provisioned by `npm run seed` / `npm run
  // admin:sync` from these values — never hard-coded. Falls back to a
  // clearly-fake demo password only so a first `npm run seed` doesn't crash
  // if someone skips this section of .env; seed.js prints a loud warning
  // when that happens.
  adminName: process.env.ADMIN_NAME || 'Site Admin',
  adminEmail: (process.env.ADMIN_EMAIL || 'admin@presence.app').toLowerCase().trim(),
  adminPassword: process.env.ADMIN_PASSWORD || null,

  // Optional — emails the admin when a new user signs up, on top of the
  // in-app notification bell (which always works with no setup). Uses
  // Resend's HTTP API directly via fetch, so no extra dependency. Leave
  // RESEND_API_KEY unset to skip email entirely; the in-app notification
  // still fires either way.
  resendApiKey: process.env.RESEND_API_KEY || null,
  notificationEmailFrom: process.env.NOTIFICATION_EMAIL_FROM || 'Presence <onboarding@resend.dev>',
};
