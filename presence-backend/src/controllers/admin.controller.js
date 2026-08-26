import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { publicUser } from '../services/token.service.js';

export const dashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const [totalEvents, upcomingEvents, totalRegistrations, totalCheckedIn] = await Promise.all([
    Event.countDocuments(),
    Event.countDocuments({ status: 'published', date: { $gte: now } }),
    Registration.countDocuments({ status: 'confirmed' }),
    Attendance.countDocuments(),
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
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users: users.map(publicUser) });
});

// Cross-event attendance report — backs the Reports page, which needs every
// registration regardless of which event it belongs to, with the event and
// attendee already joined in so the frontend doesn't have to stitch N calls
// together itself.
export const allRegistrations = asyncHandler(async (req, res) => {
  const { eventId } = req.query;
  const registrations = await Registration.find(eventId ? { event: eventId } : {})
    .populate('user', 'name email')
    .populate('event', 'title')
    .populate('attendance')
    .sort({ createdAt: -1 });
  res.json({ registrations });
});
