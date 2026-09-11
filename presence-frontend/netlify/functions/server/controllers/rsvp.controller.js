import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateReference, generateAttendanceToken } from '../utils/tokens.js';
import { assertEventAccess } from '../utils/authz.js';
import { endOfDayInEventTimezone } from '../utils/checkInWindow.js';
import { sendSms } from '../utils/sms.js';
import { config } from '../config/env.js';
// CamPay's client is kept in utils/campay.js but not imported here —
// Fapshi is the active provider (see below). Re-add
// `import * as campay from '../utils/campay.js';` and swap the calls in
// the paid-event branch below to switch back.
import * as fapshi from '../utils/fapshi.js';

export const rsvpToEvent = asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.id;

  const event = await Event.findById(eventId);
  if (!event) throw ApiError.notFound('Event not found.');
  if (event.status !== 'published') throw ApiError.badRequest('This event is not open for registration.');
  // registrationDeadline is stored as a plain date (midnight UTC of that
  // calendar day) — comparing it directly against "now" would make a
  // deadline of "today" expire at 1am Douala time, not at the end of the
  // day like an organizer setting "today" as the deadline actually means.
  if (endOfDayInEventTimezone(event.registrationDeadline, event.timezone) < new Date()) {
    throw ApiError.badRequest('Registration for this event has closed.');
  }

  // Paid events (event.price > 0) go through a REAL Fapshi Mobile Money
  // charge: the attendee is redirected to a Fapshi-hosted checkout page,
  // enters their own MTN/Orange Money number there, and the seat only
  // becomes usable once Fapshi itself confirms the transaction succeeded
  // (verified via getPaymentStatus() in checkPaymentStatus()/
  // fapshiWebhook() below — never by trusting anything the client
  // claims). Requires FAPSHI_API_USER/FAPSHI_API_KEY to be set.
  //
  // (CamPay's client in utils/campay.js is kept dormant alongside this —
  // switching providers back would mean swapping the calls below, not
  // rewriting them from scratch.)
  const isPaid = event.price > 0;
  if (isPaid && !req.body.email?.trim()) {
    throw ApiError.badRequest('An email address is required to pay for this event.');
  }

  // Custom registration questions the organizer set up (see EventForm) —
  // matched to submitted answers by label, not index, since that's the
  // stable identity the frontend renders against too. Anything marked
  // `required` must have a non-empty answer; missing optional answers are
  // just stored as ''.
  const submittedAnswers = req.body.answers && typeof req.body.answers === 'object' ? req.body.answers : {};
  const missingRequired = (event.registrationQuestions || []).filter(
    (q) => q.required && !String(submittedAnswers[q.label] || '').trim()
  );
  if (missingRequired.length > 0) {
    throw ApiError.badRequest(`Please answer: ${missingRequired.map((q) => q.label).join(', ')}`);
  }
  const answers = (event.registrationQuestions || []).map((q) => ({
    label: q.label,
    answer: String(submittedAnswers[q.label] || '').trim().slice(0, 1000),
  }));

  const existing = await Registration.findOne({ user: userId, event: eventId });
  if (existing && ['confirmed', 'waitlisted'].includes(existing.status) && existing.paymentStatus !== 'failed') {
    throw ApiError.conflict(existing.status === 'waitlisted' ? 'You are already on the waitlist for this event.' : 'You are already registered for this event.');
  }

  const confirmedCount = await Registration.countDocuments({ event: eventId, status: 'confirmed' });
  const isFull = confirmedCount >= event.capacity;

  // Waitlist only supports free events for now. A paid waitlist needs
  // "authorize now, capture later" — Fapshi's checkout charges immediately
  // once the attendee completes it, so someone waitlisted for a paid
  // event who never gets a seat would need an automatic refund flow we
  // don't have yet. Rather than risk charging someone for a seat that
  // never materializes, paid events just stay hard-capped at capacity.
  if (isFull && isPaid) {
    throw ApiError.badRequest('This event has reached full capacity.');
  }

  const registrationReference = generateReference();
  // Fapshi needs a redirectUrl pointing back to this specific
  // registration's pass page — but we don't have a registration id until
  // AFTER creating it, and we need Fapshi's response BEFORE creating it
  // (so a rejected payment never leaves an orphaned registration behind).
  // Pre-generating the id here breaks that chicken-and-egg: the existing
  // registration reuses its own real _id, a new one gets this pre-made id
  // handed to it explicitly at creation time below. config.corsOrigin (the
  // FIRST entry of the possibly comma-separated CORS_ORIGIN env var) is
  // used as the known frontend origin rather than trusting anything
  // client-supplied for a redirect target, and rather than the raw env var
  // itself — CORS_ORIGIN is deliberately allowed to hold multiple
  // comma-separated origins for CORS purposes, but Fapshi needs exactly
  // one URL to redirect back to, so passing the raw multi-value string
  // through here would produce an invalid URL like
  // "http://localhost:5173,https://your-site.netlify.app/qr-pass/...".
  const registrationId = existing ? existing._id : new mongoose.Types.ObjectId();
  const redirectUrl = config.corsOrigin ? `${config.corsOrigin}/qr-pass/${registrationId}` : undefined;

  let fapshiResult = null;
  if (isPaid) {
    // Do the real money-moving call BEFORE writing anything to the
    // database — if Fapshi rejects the request outright, nothing gets
    // created and the attendee just retries.
    try {
      fapshiResult = await fapshi.initiatePay({
        amount: event.price,
        email: req.body.email.trim(),
        externalReference: registrationReference,
        redirectUrl,
        userId,
        message: event.title,
      });
    } catch (err) {
      throw ApiError.badRequest(err.message || 'Could not start the Mobile Money payment. Please try again.');
    }
  }

  const paymentFields = isPaid
    ? {
        paymentStatus: 'pending',
        paymentReference: null,
        paymentGatewayReference: fapshiResult.transId,
        paymentPhone: null, // Fapshi collects the phone on its own hosted page, not from us
      }
    : { paymentStatus: 'not_required', paymentReference: null, paymentGatewayReference: null, paymentPhone: null };

  const registrationStatus = isFull ? 'waitlisted' : 'confirmed';

  let registration;
  try {
    if (existing) {
      // A [user, event] unique index means a cancelled (or failed-payment)
      // registration can't just be re-inserted — reactivate the same
      // record with a fresh reference/token instead, so retrying works.
      existing.status = registrationStatus;
      existing.registrationReference = registrationReference;
      existing.attendanceToken = generateAttendanceToken();
      existing.answers = answers;
      Object.assign(existing, paymentFields);
      registration = await existing.save();
    } else {
      registration = await Registration.create({
        _id: registrationId,
        user: userId,
        event: eventId,
        registrationReference,
        attendanceToken: generateAttendanceToken(),
        status: registrationStatus,
        answers,
        ...paymentFields,
      });
    }
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict('You are already registered for this event.');
    throw err;
  }

  if (isFull) {
    // 1-indexed position in the queue — how many people were already
    // waiting ahead of this one (created earlier, still waitlisted).
    const position = await Registration.countDocuments({
      event: eventId,
      status: 'waitlisted',
      createdAt: { $lt: registration.createdAt },
    }) + 1;
    return res.status(201).json({ registration, waitlisted: true, waitlistPosition: position });
  }

  res.status(201).json({
    registration,
    // The frontend redirects the browser to `link` to complete payment on
    // Fapshi's hosted checkout page, then polls payment-status once the
    // attendee is redirected back (or the webhook lands first — whichever
    // happens sooner).
    payment: isPaid ? { link: fapshiResult.link, transId: fapshiResult.transId } : null,
  });

  // Best-effort — never blocks or fails the RSVP response above. No-ops
  // quietly if the attendee has no phone on file or SMS isn't configured
  // (see utils/sms.js).
  sendSms(
    req.user.phone,
    `Presence: You're registered for "${event.title}" on ${new Date(event.date).toLocaleDateString()}. Show your QR pass at the door to check in.`
  ).catch(() => {});
});

// Polled by the frontend after rsvpToEvent() — the attendee has been
// redirected to Fapshi's hosted checkout, and this is checked once they
// come back (or before, in case the webhook already landed). Always
// re-verifies with Fapshi directly (never trusts a stored/cached status)
// so the result is only ever as fresh and as trustworthy as Fapshi's own
// records.
export const checkPaymentStatus = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.registrationId).populate('event');
  if (!registration) throw ApiError.notFound('Registration not found.');
  const isOwner = registration.user.toString() === req.user.id;
  const isStaff = ['ADMIN', 'ORGANIZER'].includes(req.user.role);
  if (!isOwner && !isStaff) throw ApiError.forbidden();

  if (registration.paymentStatus !== 'pending' || !registration.paymentGatewayReference) {
    return res.json({ paymentStatus: registration.paymentStatus });
  }

  const result = await fapshi.getPaymentStatus(registration.paymentGatewayReference);
  if (result.status === 'SUCCESSFUL') {
    registration.paymentStatus = 'confirmed';
    await registration.save();
  } else if (result.status === 'FAILED' || result.status === 'EXPIRED') {
    registration.paymentStatus = 'failed';
    await registration.save();
  }
  // else still PENDING/CREATED — leave as-is, frontend keeps polling.

  res.json({ paymentStatus: registration.paymentStatus, fapshiStatus: result.status });
});

// Fapshi calls this URL directly (configured in the Fapshi dashboard under
// Developer → Webhooks) when a transaction's status changes — this is
// what confirms payment even if the attendee closes the app before the
// frontend's polling picks it up. The webhook body is only ever used to
// find WHICH transaction to check — the actual status is always
// re-verified with a direct, authenticated call to Fapshi (see
// utils/fapshi.js), so a forged or replayed call to this URL can't fake a
// payment: at worst it triggers a real (harmless) status re-check.
export const fapshiWebhook = asyncHandler(async (req, res) => {
  const transId = req.body?.transId || req.query?.transId;
  if (!transId) return res.status(200).json({ received: true, note: 'no transId in payload' });

  const registration = await Registration.findOne({ paymentGatewayReference: transId });
  if (!registration) return res.status(200).json({ received: true, note: 'no matching registration' });

  try {
    const result = await fapshi.getPaymentStatus(transId);
    if (result.status === 'SUCCESSFUL') {
      registration.paymentStatus = 'confirmed';
      await registration.save();
    } else if (result.status === 'FAILED' || result.status === 'EXPIRED') {
      registration.paymentStatus = 'failed';
      await registration.save();
    }
  } catch (err) {
    console.error('[fapshi-webhook] status re-check failed', err.message);
  }

  res.status(200).json({ received: true });
});

// Manual override, kept only as a fallback for edge cases the automated
// flow can't cover (e.g. CamPay's status API is down, or a rare payment
// made outside the app that still needs honoring) — NOT the primary path
// anymore now that CamPay verifies payments for real. Worth keeping
// restricted to ADMIN/ORGANIZER (see routes/attendance.routes.js).
export const confirmPayment = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.registrationId).populate('event');
  if (!registration) throw ApiError.notFound('Registration not found.');
  assertEventAccess(req.user, registration.event);
  if (registration.paymentStatus === 'not_required') {
    throw ApiError.badRequest('This registration has no payment to confirm.');
  }
  registration.paymentStatus = 'confirmed';
  await registration.save();
  res.json({ registration });
});

export const cancelRsvp = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.registrationId);
  if (!registration) throw ApiError.notFound('Registration not found.');
  const isOwner = registration.user.toString() === req.user.id;
  const isStaff = ['ADMIN', 'ORGANIZER'].includes(req.user.role);
  if (!isOwner && !isStaff) throw ApiError.forbidden();

  const wasConfirmed = registration.status === 'confirmed';
  registration.status = 'cancelled';
  await registration.save();

  // Cancelling a CONFIRMED seat frees up capacity — automatically pull the
  // longest-waiting person off the waitlist into that seat, rather than
  // making an organizer do this by hand every time. Cancelling from the
  // waitlist itself doesn't free a real seat, so nothing to promote there.
  if (wasConfirmed) {
    const next = await Registration.findOne({ event: registration.event, status: 'waitlisted' }).sort({ createdAt: 1 });
    if (next) {
      next.status = 'confirmed';
      await next.save();
    }
  }

  res.json({ message: 'Registration cancelled.' });
});

export const eventAttendees = asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const event = await Event.findById(eventId);
  if (!event) throw ApiError.notFound('Event not found.');
  assertEventAccess(req.user, event);
  const registrations = await Registration.find({ event: eventId })
    .populate('user', 'name email')
    .populate('attendance')
    .sort({ createdAt: -1 });
  res.json({ attendees: registrations });
});

export const myRegistrations = asyncHandler(async (req, res) => {
  const registrations = await Registration.find({ user: req.user.id, status: { $in: ['confirmed', 'waitlisted'] } })
    .populate('event')
    .populate('attendance')
    .sort({ createdAt: -1 });
  res.json({ registrations: registrations.map(hideMeetingUrlUnlessConfirmed) });
});

// A registration document's populated `event` sub-document isn't filtered
// through withRemaining() in event.controller.js (that only applies to the
// general public/admin event listing endpoints) — so without this, a
// *waitlisted* registration's raw API response would still carry the real
// meetingUrl in its JSON even though the UI only ever renders the "Join
// meeting" button for confirmed ones. That's a real gap between what's
// displayed and what's technically sent over the wire, not just a display
// nicety — someone checking the network tab would see it. Confirmed
// registrants (and organizers/admins, via isOwner/isStaff in the callers
// above) are exactly who should see it, so this only strips it for anyone
// else.
function hideMeetingUrlUnlessConfirmed(registration) {
  const json = registration.toJSON();
  if (json.status !== 'confirmed' && json.event) delete json.event.meetingUrl;
  return json;
}

export const getRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.registrationId)
    .populate('event')
    .populate('attendance')
    .populate('user', 'name email');
  if (!registration) throw ApiError.notFound('Registration not found.');
  const isOwner = registration.user.id === req.user.id;
  const isStaff = ['ADMIN', 'ORGANIZER'].includes(req.user.role);
  if (!isOwner && !isStaff) throw ApiError.forbidden();
  res.json({ registration: hideMeetingUrlUnlessConfirmed(registration) });
});

// Organizer override to pull a specific person off the waitlist (e.g. a
// VIP, or filling a last-minute cancellation faster than waiting for the
// automatic FIFO promotion in cancelRsvp() above). Does NOT check capacity
// — an organizer doing this deliberately is trusted to know why.
export const promoteFromWaitlist = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.registrationId).populate('event');
  if (!registration) throw ApiError.notFound('Registration not found.');
  assertEventAccess(req.user, registration.event);
  if (registration.status !== 'waitlisted') {
    throw ApiError.badRequest('This registration is not on the waitlist.');
  }
  registration.status = 'confirmed';
  await registration.save();
  res.json({ registration });
});

// Organizer manually marks an attendee present without a QR scan (e.g. a
// forgotten phone at the door) — goes through the same duplicate guard.
export const manualCheckIn = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.registrationId).populate('event');
  if (!registration) throw ApiError.notFound('Registration not found.');
  assertEventAccess(req.user, registration.event);

  const existing = await Attendance.findOne({ registration: registration.id });
  if (existing) throw ApiError.conflict('Attendee has already checked in.');

  try {
    const attendance = await Attendance.create({
      registration: registration.id,
      event: registration.event.id,
      checkedInBy: req.user.id,
    });
    res.status(201).json({ attendance });
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict('Attendee has already checked in.');
    throw err;
  }
});
