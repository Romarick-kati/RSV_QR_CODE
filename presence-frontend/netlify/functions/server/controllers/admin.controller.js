import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { publicUser } from '../services/token.service.js';
import { adminValidators } from '../validators/validators.js';

const SALT_ROUNDS = 12;

export const dashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  // ORGANIZER accounts only ever see numbers for their own events — same
  // reasoning as the event-list scoping in event.controller.js.
  const ownEventFilter = req.user.role === 'ORGANIZER' ? { organizer: req.user.id } : {};
  const ownEventIds = req.user.role === 'ORGANIZER'
    ? (await Event.find(ownEventFilter, '_id')).map((e) => e._id)
    : null;
  const registrationFilter = ownEventIds ? { event: { $in: ownEventIds } } : {};
  const attendanceFilter = ownEventIds ? { event: { $in: ownEventIds } } : {};

  const [totalEvents, upcomingEvents, totalRegistrations, totalCheckedIn] = await Promise.all([
    Event.countDocuments(ownEventFilter),
    Event.countDocuments({ ...ownEventFilter, status: 'published', date: { $gte: now } }),
    Registration.countDocuments({ ...registrationFilter, status: 'confirmed' }),
    Attendance.countDocuments(attendanceFilter),
  ]);

  res.json({
    totalEvents,
    upcomingEvents,
    totalRegistrations,
    totalCheckedIn,
    pendingRsvps: totalRegistrations - totalCheckedIn,
    attendanceRate: totalRegistrations ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0,
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = search
    ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
    : {};
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ users: users.map(publicUser) });
});

// Lets an admin add a user directly (e.g. an organizer account for a
// colleague) without them going through public sign-up first. Deliberately
// does NOT fire notifyNewUser — that's for people joining on their own; an
// account the admin just created themselves isn't news to the admin.
export const createUser = asyncHandler(async (req, res) => {
  adminValidators.createUser(req.body);
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists.');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role: role || 'ATTENDEE' });
  res.status(201).json({ user: publicUser(user) });
});

export const updateUser = asyncHandler(async (req, res) => {
  adminValidators.updateUser(req.body);
  const { name, email, role, password } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');

  // Guard against locking everyone out by demoting the last remaining admin.
  if (role && role !== 'ADMIN' && user.role === 'ADMIN') {
    const otherAdmins = await User.countDocuments({ role: 'ADMIN', _id: { $ne: user.id } });
    if (otherAdmins === 0) throw ApiError.badRequest('You cannot remove admin access from the only admin account.');
  }

  if (email && email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw ApiError.conflict('Another account already uses this email.');
    user.email = email.toLowerCase();
  }
  if (name) user.name = name;
  if (role) user.role = role;
  if (password) user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await user.save();
  res.json({ user: publicUser(user) });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');

  if (user.id === req.user.id) throw ApiError.badRequest('You cannot delete your own account while signed in as it.');

  if (user.role === 'ADMIN') {
    const otherAdmins = await User.countDocuments({ role: 'ADMIN', _id: { $ne: user.id } });
    if (otherAdmins === 0) throw ApiError.badRequest('You cannot delete the only admin account.');
  }

  // Cascade: a deleted user's registrations (and any attendance tied to
  // those registrations) would otherwise be orphaned rows pointing at a
  // user that no longer exists — clean those up too rather than leaving
  // dangling references the reports/analytics pages would choke on.
  const registrations = await Registration.find({ user: user.id }, '_id');
  const registrationIds = registrations.map((r) => r._id);
  await Attendance.deleteMany({ registration: { $in: registrationIds } });
  await Registration.deleteMany({ user: user.id });
  await user.deleteOne();

  res.json({ message: 'User deleted.' });
});

// --- Notifications ---------------------------------------------------------

export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
  const unreadCount = notifications.filter((n) => !n.readBy.some((id) => id.equals(req.user.id))).length;
  const shaped = notifications.map((n) => ({
    ...publicUser(n),
    readByMe: n.readBy.some((id) => id.equals(req.user.id)),
    readBy: undefined, // who else has read it isn't the frontend's business
  }));
  res.json({ notifications: shaped, unreadCount });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw ApiError.notFound('Notification not found.');
  if (!notification.readBy.some((id) => id.equals(req.user.id))) {
    notification.readBy.push(req.user.id);
    await notification.save();
  }
  res.json({ notification: publicUser(notification) });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ readBy: { $ne: req.user.id } }, { $addToSet: { readBy: req.user.id } });
  res.json({ message: 'All notifications marked as read.' });
});

// Cross-event attendance report — backs the Reports page, which needs every
// registration regardless of which event it belongs to, with the event and
// attendee already joined in so the frontend doesn't have to stitch N calls
// together itself.
export const allRegistrations = asyncHandler(async (req, res) => {
  const { eventId } = req.query;
  const filter = {};
  if (req.user.role === 'ORGANIZER') {
    const ownedIds = (await Event.find({ organizer: req.user.id }, '_id')).map((e) => e._id.toString());
    if (eventId) {
      if (!ownedIds.includes(eventId)) throw ApiError.forbidden('You do not have access to this event.');
      filter.event = eventId;
    } else {
      filter.event = { $in: ownedIds };
    }
  } else if (eventId) {
    filter.event = eventId;
  }
  const registrations = await Registration.find(filter)
    .populate('user', 'name email')
    .populate('event', 'title')
    .populate('attendance')
    .sort({ createdAt: -1 });
  res.json({ registrations });
});

// --- Organizer access requests ----------------------------------------------
// ADMIN-only: review/approve/reject the self-serve requests attendees submit
// via POST /auth/me/organizer-request.
export const listOrganizerRequests = asyncHandler(async (req, res) => {
  const users = await User.find({ 'organizerRequest.status': 'pending' }).sort({ 'organizerRequest.requestedAt': 1 });
  res.json({ requests: users.map(publicUser) });
});

export const approveOrganizerRequest = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');
  if (user.organizerRequest?.status !== 'pending') throw ApiError.badRequest('This user has no pending request.');
  user.role = 'ORGANIZER';
  user.organizerRequest.status = 'approved';
  user.organizerRequest.decidedAt = new Date();
  await user.save();
  res.json({ user: publicUser(user) });
});

export const rejectOrganizerRequest = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');
  if (user.organizerRequest?.status !== 'pending') throw ApiError.badRequest('This user has no pending request.');
  user.organizerRequest.status = 'rejected';
  user.organizerRequest.decidedAt = new Date();
  await user.save();
  res.json({ user: publicUser(user) });
});
