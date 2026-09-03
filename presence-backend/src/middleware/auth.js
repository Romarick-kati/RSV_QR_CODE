import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Verifies the bearer JWT, loads the user, and attaches it to req.user.
// Every protected route goes through this — role checks below assume it
// has already run.
export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw ApiError.unauthorized('Invalid or expired session — please sign in again.');
  }

  const user = await User.findById(payload.sub).catch(() => null);
  if (!user) throw ApiError.unauthorized('Account no longer exists.');

  req.user = user;
  next();
});

// Restricts a route to specific roles. Always used *after* requireAuth.
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) throw ApiError.unauthorized();
  if (!roles.includes(req.user.role)) throw ApiError.forbidden();
  next();
};

// Populates req.user if a valid token is present, but never rejects the
// request — used for routes that behave differently for logged-in users
// (e.g. showing "already registered") without requiring login.
export const attachUserIfPresent = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = await User.findById(payload.sub);
  } catch {
    // ignore invalid/expired token on optional-auth routes
  }
  next();
});
