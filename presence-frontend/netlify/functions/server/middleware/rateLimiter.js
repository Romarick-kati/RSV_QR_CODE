import rateLimit from 'express-rate-limit';

// Generous limit for normal API traffic.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Tighter limit on auth endpoints to slow down credential-stuffing / brute force.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.' },
});

// Check-in can be hit rapidly and legitimately at a busy door, but still
// bounded to blunt abuse of the endpoint.
export const checkInLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

// The assistant calls a paid, per-token external API on every message, so
// it gets its own tighter cap layered under the global apiLimiter above —
// 15/minute is enough for a real back-and-forth conversation but blunts a
// script hammering it. Same caveat as everywhere else in this file: the
// default in-memory store doesn't persist across a Netlify Function cold
// start, so this only reliably protects a burst hitting the same warm
// container, not sustained or distributed abuse. If this assistant gets
// meaningful public traffic, swap the store for something shared (e.g.
// rate-limit-redis backed by Upstash) rather than raising this number.
export const assistantLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many messages — please wait a moment and try again.' },
});
