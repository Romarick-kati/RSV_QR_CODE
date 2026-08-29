import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateReference, generateAttendanceToken } from '../utils/tokens.js';
import { assertEventAccess } from '../utils/authz.js';
import { sendSms } from '../utils/sms.js';

export const rsvpToEvent = asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.id;

  const event = await Event.findById(eventId);
  if (!event) throw ApiError.notFound('Event not found.');
  if (event.status !== 'published') throw ApiError.badRequest('This event is not open for registration.');
  if (new Date(event.registrationDeadline) < new Date()) throw ApiError.badRequest('Registration for this event has closed.');

  // Paid events (event.price > 0) use a manual Mobile Money confirmation:
  // the attendee sends money out-of-band and submits the reference here;
  // the organizer confirms it later from the attendee list. The seat is
  // held immediately either way — it just can't be scanned in until
  // payment is confirmed (see attendance.controller.js).
  const isPaid = event.price > 0;
  if (isPaid && !req.body.paymentReference?.trim()) {
    throw ApiError.badRequest('A Mobile Money transaction reference is required for this paid event.');
  }

  const existing = await Registration.findOne({ user: userId, event: eventId });
  if (existing && existing.status === 'confirmed') {
    throw ApiError.conflict('You are already registered for this event.');
  }

  const confirmedCount = await Registration.countDocuments({ event: eventId, status: 'confirmed' });
  if (confirmedCount >= event.capacity) {
    throw ApiError.badRequest('This event has reached full capacity.');
  }

  const paymentFields = isPaid
    ? { paymentStatus: 'pending', paymentReference: req.body.paymentReference.trim() }
    : { paymentStatus: 'not_required', paymentReference: null };

  let registration;
  try {
    if (existing) {
      // A [user, event] unique index means a cancelled registration can't
      // just be re-inserted — reactivate the same record with a fresh
      // reference/token instead, so re-RSVPing after cancelling works.
      existing.status = 'confirmed';
      existing.registrationReference = generateReference();
      existing.attendanceToken = generateAttendanceToken();
      Object.assign(existing, paymentFields);
      registration = await existing.save();
    } else {
      registration = await Registration.create({
        user: userId,
        event: eventId,
        registrationReference: generateReference(),
        attendanceToken: generateAttendanceToken(),
        status: 'confirmed',
        ...paymentFields,
      });
    }
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict('You are already registered for this event.');
    throw err;
  }

  res.status(201).json({ registration });

  // Best-effort — never blocks or fails the RSVP response above. No-ops
  // quietly if the attendee has no phone on file or SMS isn't configured
  // (see utils/sms.js).
  sendSms(
    req.user.phone,
    `Presence: You're registered for "${event.title}" on ${new Date(event.date).toLocaleDateString()}. Show your QR pass at the door to check in.`
  ).catch(() => {});
});

// Organizer confirms a manually-paid Mobile Money registration after
// checking their own MoMo account for the matching transaction reference.
// Until this happens, the pass exists but won't pass check-in.
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

  registration.status = 'cancelled';
  await registration.save();
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
  const registrations = await Registration.find({ user: req.user.id, status: 'confirmed' })
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
