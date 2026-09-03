import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import Event from '../models/Event.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertEventAccess } from '../utils/authz.js';
import { isWithinCheckInWindow } from '../utils/checkInWindow.js';

// This is the single most important endpoint in the system: the QR code
// only ever carries `token` — never attendee data — so this handler is the
// one place that turns a token into a verified attendance record. The
// unique index on Attendance.registration (see models/Attendance.js) is
// what actually makes duplicate-scan protection safe under a race: two
// near-simultaneous scans of the same code both try to insert here, and
// only one can win — the loser is caught below and turned into the
// "duplicate" response instead of a second attendance record.
export const checkIn = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw ApiError.badRequest('A QR token is required.');

  const registration = await Registration.findOne({ attendanceToken: token })
    .populate('event')
    .populate('user', 'name email avatarUrl');

  if (!registration) {
    return res.status(200).json({ result: 'invalid', message: 'Invalid or expired QR code.' });
  }
  if (registration.status !== 'confirmed') {
    return res.status(200).json({ result: 'invalid', message: 'This registration is no longer active.' });
  }
  if (registration.event.status === 'cancelled') {
    return res.status(200).json({ result: 'invalid', message: 'This event has been cancelled.' });
  }
  if (registration.paymentStatus === 'pending') {
    return res.status(200).json({ result: 'invalid', message: 'Payment not yet confirmed for this pass — check the attendee list.' });
  }
  // An ORGANIZER's device can only check people into events that
  // organizer actually owns — stops a client (or a stolen/borrowed staff
  // login) from checking people into someone else's event. ADMIN is
  // unrestricted.
  assertEventAccess(req.user, registration.event);

  if (!isWithinCheckInWindow(registration.event)) {
    return res.status(200).json({
      result: 'invalid',
      message: 'This pass is outside its check-in window (opens 2h before the event, closes 3h after).',
    });
  }

  try {
    const attendance = await Attendance.create({
      registration: registration.id,
      event: registration.event.id,
      checkedInBy: req.user?.id,
    });

    return res.status(201).json({
      result: 'success',
      message: 'Attendance confirmed.',
      registration,
      attendance,
      attendee: registration.user,
      event: registration.event,
    });
  } catch (err) {
    if (err.code === 11000) {
      const already = await Attendance.findOne({ registration: registration.id });
      return res.status(200).json({
        result: 'duplicate',
        message: 'Attendee has already checked in.',
        registration,
        attendance: already,
        attendee: registration.user,
        event: registration.event,
      });
    }
    throw err;
  }
});

export const eventAttendance = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found.');
  assertEventAccess(req.user, event);

  const attendance = await Attendance.find({ event: req.params.id })
    .populate({ path: 'registration', populate: { path: 'user', select: 'name email' } })
    .sort({ checkedInAt: -1 });
  res.json({ attendance });
});
