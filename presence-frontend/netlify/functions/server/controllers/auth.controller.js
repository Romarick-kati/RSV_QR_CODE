import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import LoginCode from '../models/LoginCode.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authValidators } from '../validators/validators.js';
import { signToken, publicUser } from '../services/token.service.js';
import { notifyNewUser, sendLoginCodeEmail } from '../services/notification.service.js';
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

// ---- Passwordless sign-in with an emailed 6-digit code ----------------------
// Existing accounts only (new people use Register). The reply to "send me a
// code" is identical whether or not the email has an account, so it can't be
// used to find out who is registered.
const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_RESEND_GAP_MS = 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const hashCode = (email, code) => crypto.createHmac('sha256', config.jwtSecret).update(`${email}:${code}`).digest('hex');

export const requestEmailCode = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw ApiError.badRequest('Enter a valid email address.');
  if (!config.resendApiKey) throw ApiError.badRequest('Email sign-in is not available yet. Please sign in with your password or Google.');

  const generic = { message: 'If that email has a Presence account, a code is on its way.' };
  const user = await User.findOne({ email });
  if (!user) return res.json(generic);

  const existing = await LoginCode.findOne({ email });
  if (existing && Date.now() - existing.createdAt.getTime() < CODE_RESEND_GAP_MS) return res.json(generic);

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await LoginCode.findOneAndUpdate(
    { email },
    { codeHash: hashCode(email, code), attempts: 0, createdAt: new Date(), expiresAt: new Date(Date.now() + CODE_TTL_MS) },
    { upsert: true, setDefaultsOnInsert: true }
  );
  const sent = await sendLoginCodeEmail(email, code);
  if (!sent) {
    await LoginCode.deleteOne({ email });
    throw ApiError.badRequest('We could not send the email right now. Please try again, or use your password.');
  }
  res.json(generic);
});

export const verifyEmailCode = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '').replace(/\s/g, '');
  const bad = () => ApiError.badRequest('That code is incorrect or has expired.');
  if (!email || !/^\d{6}$/.test(code)) throw bad();

  const row = await LoginCode.findOne({ email });
  if (!row || row.expiresAt.getTime() < Date.now()) throw bad();
  if (row.attempts >= MAX_CODE_ATTEMPTS) { await LoginCode.deleteOne({ email }); throw bad(); }

  const a = Buffer.from(hashCode(email, code));
  const b = Buffer.from(row.codeHash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    row.attempts += 1;
    await row.save();
    throw bad();
  }
  await LoginCode.deleteOne({ email });
  const user = await User.findOne({ email });
  if (!user) throw bad();
  res.json({ token: signToken(user), user: publicUser(user) });
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
