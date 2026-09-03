import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateReference, generateAttendanceToken } from '../utils/tokens.js';
import { assertEventAccess } from '../utils/authz.js';
import { endOfDayInEventTimezone } from '../utils/checkInWindow.js';
import { sendSms } from '../utils/sms.js';
import * as campay from '../utils/campay.js';

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

  // Paid events (event.price > 0) go through a REAL CamPay Mobile Money
  // charge: the attendee gives their phone number, CamPay sends a
  // PIN-approval prompt to that phone, and the seat only becomes usable
  // once CamPay itself confirms the transaction succeeded (verified via
  // getTransactionStatus() in checkPaymentStatus()/campayWebhook() below —
  // never by trusting anything the client claims). Requires
  // CAMPAY_PERMANENT_TOKEN to be set in the environment.
  const isPaid = event.price > 0;
  if (isPaid && !req.body.phone?.trim()) {
    throw ApiError.badRequest('A Mobile Money phone number is required for this paid event.');
  }

  const existing = await Registration.findOne({ user: userId, event: eventId });
  if (existing && ['confirmed', 'waitlisted'].includes(existing.status) && existing.paymentStatus !== 'failed') {
    throw ApiError.conflict(existing.status === 'waitlisted' ? 'You are already on the waitlist for this event.' : 'You are already registered for this event.');
  }

  const confirmedCount = await Registration.countDocuments({ event: eventId, status: 'confirmed' });
  const isFull = confirmedCount >= event.capacity;

  // Waitlist only supports free events for now. A paid waitlist needs
  // "authorize now, capture later" — CamPay's collect API charges
  // immediately, so someone waitlisted for a paid event who never gets a
  // seat would need an automatic refund flow we don't have yet. Rather
  // than risk charging someone for a seat that never materializes, paid
  // events just stay hard-capped at capacity for now.
  if (isFull && isPaid) {
    throw ApiError.badRequest('This event has reached full capacity.');
  }

  const registrationReference = generateReference();

  let campayResult = null;
  if (isPaid) {
    // Do the real money-moving call BEFORE writing anything to the
    // database — if CamPay rejects the phone number or the request
    // outright, nothing gets created and the attendee just retries.
    try {
      campayResult = await campay.initiateCollect({
        amount: event.price,
        phone: req.body.phone,
        description: event.title,
        externalReference: registrationReference,
      });
    } catch (err) {
      throw ApiError.badRequest(err.message || 'Could not start the Mobile Money payment. Check the phone number and try again.');
    }
  }

  const paymentFields = isPaid
    ? {
        paymentStatus: 'pending',
        paymentReference: null,
        paymentGatewayReference: campayResult.reference,
        paymentPhone: campay.normalizeCameroonPhone(req.body.phone),
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
      Object.assign(existing, paymentFields);
      registration = await existing.save();
    } else {
      registration = await Registration.create({
        user: userId,
        event: eventId,
        registrationReference,
        attendanceToken: generateAttendanceToken(),
        status: registrationStatus,
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
    // The frontend uses this to show "check your phone for the PIN
    // prompt" and to know what to poll while waiting for confirmation.
    payment: isPaid ? { reference: campayResult.reference, ussdCode: campayResult.ussd_code, operator: campayResult.operator } : null,
  });

  // Best-effort — never blocks or fails the RSVP response above. No-ops
  // quietly if the attendee has no phone on file or SMS isn't configured
  // (see utils/sms.js).
  sendSms(
    req.user.phone,
    `Presence: You're registered for "${event.title}" on ${new Date(event.date).toLocaleDateString()}. Show your QR pass at the door to check in.`
  ).catch(() => {});
});

// Polled by the frontend after rsvpToEvent() while a CamPay Mobile Money
// prompt is pending on the attendee's phone. Always re-verifies with
// CamPay directly (never trusts a stored/cached status) so the result is
// only ever as fresh and as trustworthy as CamPay's own records.
export const checkPaymentStatus = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.registrationId).populate('event');
  if (!registration) throw ApiError.notFound('Registration not found.');
  const isOwner = registration.user.toString() === req.user.id;
  const isStaff = ['ADMIN', 'ORGANIZER'].includes(req.user.role);
  if (!isOwner && !isStaff) throw ApiError.forbidden();

  if (registration.paymentStatus !== 'pending' || !registration.paymentGatewayReference) {
    return res.json({ paymentStatus: registration.paymentStatus });
  }

  const result = await campay.getTransactionStatus(registration.paymentGatewayReference);
  if (result.status === 'SUCCESSFUL') {
    registration.paymentStatus = 'confirmed';
    await registration.save();
  } else if (result.status === 'FAILED') {
    registration.paymentStatus = 'failed';
    await registration.save();
  }
  // else still PENDING — leave as-is, frontend keeps polling.

  res.json({ paymentStatus: registration.paymentStatus, campayStatus: result.status });
});

// CamPay calls this URL directly (configured in the CamPay dashboard under
// WEBHOOK → your callback URL) when a transaction's status changes — this
// is what confirms payment even if the attendee closes the app before the
// frontend's polling picks it up. The webhook body/query is only ever used
// to find WHICH transaction to check — the actual status is always
// re-verified with a direct, authenticated call to CamPay (see
// utils/campay.js), so a forged or replayed call to this URL can't fake a
// payment: at worst it triggers a real (harmless) status re-check.
export const campayWebhook = asyncHandler(async (req, res) => {
  const reference = req.body?.reference || req.query?.reference;
  if (!reference) return res.status(200).json({ received: true, note: 'no reference in payload' });

  const registration = await Registration.findOne({ paymentGatewayReference: reference });
  if (!registration) return res.status(200).json({ received: true, note: 'no matching registration' });

  try {
    const result = await campay.getTransactionStatus(reference);
    if (result.status === 'SUCCESSFUL') {
      registration.paymentStatus = 'confirmed';
      await registration.save();
    } else if (result.status === 'FAILED') {
      registration.paymentStatus = 'failed';
      await registration.save();
    }
  } catch (err) {
    console.error('[campay-webhook] status re-check failed', err.message);
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
  res.json({ registrations });
});

export const getRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.registrationId)
    .populate('event')
    .populate('attendance')
    .populate('user', 'name email');
  if (!registration) throw ApiError.notFound('Registration not found.');
  const isOwner = registration.user.id === req.user.id;
  const isStaff = ['ADMIN', 'ORGANIZER'].includes(req.user.role);
  if (!isOwner && !isStaff) throw ApiError.forbidden();
  res.json({ registration });
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
