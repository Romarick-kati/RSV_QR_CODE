import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import LiveLocation from '../models/LiveLocation.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertEventAccess } from '../utils/authz.js';

// Live location is strictly opt-in and per event:
//  - the organizer must switch "live tracking" on for the event,
//  - the attendee must hold a confirmed registration AND start sharing
//    themselves from their own pass (there is no way for anyone to start it
//    on someone else's behalf),
//  - only the event's owner (or an admin) can read it, and only for people
//    currently sharing,
//  - the attendee can stop at any moment, which deletes their position.
const FRESH_MS = 15 * 60 * 1000;
const MIN_GAP_MS = 5 * 1000;

function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export const shareLocation = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found.');
  if (!event.liveTracking) throw ApiError.badRequest('Live location is not enabled for this event.');
  if (event.status === 'cancelled') throw ApiError.badRequest('This event has been cancelled.');

  const registration = await Registration.findOne({ event: event._id, user: req.user.id, status: 'confirmed' });
  if (!registration || ['pending', 'failed'].includes(registration.paymentStatus)) {
    throw ApiError.forbidden('You need a confirmed registration to share your location for this event.');
  }

  const latitude = Number(req.body.latitude);
  const longitude = Number(req.body.longitude);
  const accuracy = req.body.accuracy == null ? null : Number(req.body.accuracy);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw ApiError.badRequest('A valid latitude and longitude are required.');
  }

  const existing = await LiveLocation.findOne({ event: event._id, user: req.user.id });
  if (existing && Date.now() - existing.updatedAt.getTime() < MIN_GAP_MS) {
    return res.json({ sharing: true });
  }
  await LiveLocation.findOneAndUpdate(
    { event: event._id, user: req.user.id },
    { latitude, longitude, accuracy: Number.isFinite(accuracy) ? accuracy : null, updatedAt: new Date() },
    { upsert: true, setDefaultsOnInsert: true }
  );
  res.json({ sharing: true });
});

export const stopSharing = asyncHandler(async (req, res) => {
  await LiveLocation.deleteOne({ event: req.params.id, user: req.user.id });
  res.json({ sharing: false });
});

export const listLive = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found.');
  assertEventAccess(req.user, event);

  const since = new Date(Date.now() - FRESH_MS);
  const [rows, registered] = await Promise.all([
    LiveLocation.find({ event: event._id, updatedAt: { $gte: since } }).populate('user', 'name avatarUrl').sort({ updatedAt: -1 }),
    Registration.countDocuments({ event: event._id, status: 'confirmed' }),
  ]);
  const hasVenue = Number.isFinite(event.latitude) && Number.isFinite(event.longitude);
  res.json({
    enabled: !!event.liveTracking,
    venue: hasVenue ? { latitude: event.latitude, longitude: event.longitude } : null,
    registered,
    people: rows.map((r) => ({
      id: r.user?.id,
      name: r.user?.name || 'Attendee',
      avatarUrl: r.user?.avatarUrl || null,
      latitude: r.latitude,
      longitude: r.longitude,
      accuracy: r.accuracy,
      updatedAt: r.updatedAt,
      distanceMeters: hasVenue ? haversineMeters(event.latitude, event.longitude, r.latitude, r.longitude) : null,
    })),
  });
});
