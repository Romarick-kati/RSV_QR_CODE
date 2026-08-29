import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authValidators } from '../validators/validators.js';
import { signToken, publicUser } from '../services/token.service.js';
import { notifyNewUser } from '../services/notification.service.js';
import { config } from '../config/env.js';

const SALT_ROUNDS = 12;
const googleClient = config.googleClientId ? new OAuth2Client(config.googleClientId) : null;

export const register = asyncHandler(async (req, res) => {
  authValidators.register(req.body);
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists.');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role: 'ATTENDEE' });
  notifyNewUser(user).catch(() => {}); // never let a notification failure break signup

  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  authValidators.login(req.body);
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  // Deliberately identical error for "no such user" and "wrong password" —
  // distinguishing them lets an attacker enumerate valid emails.
  if (!user) throw ApiError.badRequest('Incorrect email or password.');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw ApiError.badRequest('Incorrect email or password.');

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  // Stateless JWT — logout is a client-side token discard. Endpoint exists
  // for API symmetry and so a future refresh-token/blacklist upgrade has
  // somewhere to live without changing the frontend contract.
  res.json({ message: 'Signed out.' });
});

// "Sign in with Google" — the frontend uses Google Identity Services to get
// a signed ID token straight from Google, then hands it to us here. We
// verify the signature and audience with Google's own library (never trust
// a client-supplied "this is who I am" claim without verifying it), then
// find-or-create the local user and issue our own JWT exactly as login()
// does, so the rest of the app never has to know which auth method was used.
//
// Lookup order matters here:
//   1. By googleId  — the user has signed in with Google before.
//   2. By email      — an account already exists (created via normal email/
//      password signup, or a previous Google session under an older flow).
//      We link the Google identity onto that existing account instead of
//      creating a duplicate, exactly as requested.
//   3. Neither found — create a brand new account.
export const googleAuth = asyncHandler(async (req, res) => {
  if (!googleClient) {
    throw ApiError.badRequest('Google sign-in is not configured on this server. Set GOOGLE_CLIENT_ID in .env.');
  }
  const { credential } = req.body;
  if (!credential) throw ApiError.badRequest('Missing Google credential.');

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: config.googleClientId });
    payload = ticket.getPayload();
  } catch {
    throw ApiError.unauthorized('Could not verify Google sign-in. Please try again.');
  }
  if (!payload?.email) throw ApiError.unauthorized('Google account has no accessible email.');
  if (payload.email_verified === false) throw ApiError.unauthorized('Google account email is not verified.');

  const email = payload.email.toLowerCase();
  const googleId = payload.sub;
  const name = payload.name || email.split('@')[0];
  const avatarUrl = payload.picture || null;

  let user = await User.findOne({ googleId });

  if (!user) {
    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      // Link this Google identity onto the existing account rather than
      // creating a duplicate — the account keeps working with its original
      // password too, Google just becomes an additional way in.
      existingByEmail.googleId = googleId;
      existingByEmail.avatarUrl = existingByEmail.avatarUrl || avatarUrl;
      user = await existingByEmail.save();
    } else {
      // Random, never-used password hash — this account can only ever sign
      // in via Google, but the column stays non-nullable and every other
      // code path that checks passwordHash keeps working unchanged.
      const randomPassword = await bcrypt.hash(crypto.randomUUID(), SALT_ROUNDS);
      user = await User.create({ name, email, passwordHash: randomPassword, role: 'ATTENDEE', googleId, avatarUrl });
      notifyNewUser(user).catch(() => {}); // never let a notification failure break sign-in
    }
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// Rough ceiling on the avatar data URL (~2MB decoded). The frontend already
// compresses photos to a small square well under this before sending them —
// this is just a backstop against something huge slipping through.
const MAX_AVATAR_LENGTH = 2_800_000;

export const updateMe = asyncHandler(async (req, res) => {
  const { name, avatarUrl, phone } = req.body;
  if (name !== undefined) {
    if (!name.trim()) throw ApiError.badRequest('Name is required.');
    req.user.name = name.trim();
  }
  if (phone !== undefined) {
    req.user.phone = phone === null || phone === '' ? null : String(phone).trim();
  }
  if (avatarUrl !== undefined) {
    if (avatarUrl === null || avatarUrl === '') {
      req.user.avatarUrl = null;
    } else {
      if (typeof avatarUrl !== 'string' || !avatarUrl.startsWith('data:image/')) {
        throw ApiError.badRequest('Profile photo must be a valid image.');
      }
      if (avatarUrl.length > MAX_AVATAR_LENGTH) {
        throw ApiError.badRequest('Profile photo is too large. Please choose a smaller image.');
      }
      req.user.avatarUrl = avatarUrl;
    }
  }
  if (name === undefined && avatarUrl === undefined && phone === undefined) {
    throw ApiError.badRequest('Nothing to update.');
  }
  const user = await req.user.save();
  res.json({ user: publicUser(user) });
});

// --- Self-serve organizer requests -----------------------------------------
// An ATTENDEE applies here; an ADMIN reviews and approves/rejects from
// Admin Users. This is what lets you sell accounts without personally
// creating every client's login by hand.
export const requestOrganizerAccess = asyncHandler(async (req, res) => {
  if (req.user.role !== 'ATTENDEE') {
    throw ApiError.badRequest('Only attendee accounts can apply for organizer access.');
  }
  if (req.user.organizerRequest?.status === 'pending') {
    throw ApiError.conflict('You already have a pending request.');
  }
  const { organizationName, reason } = req.body;
  if (!organizationName?.trim()) throw ApiError.badRequest('Organization or business name is required.');

  req.user.organizerRequest = {
    status: 'pending',
    organizationName: organizationName.trim(),
    reason: reason?.trim() || null,
    requestedAt: new Date(),
    decidedAt: null,
  };
  const user = await req.user.save();
  res.json({ user: publicUser(user) });
});
