import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { eventValidators } from '../validators/validators.js';
import { escapeRegex } from '../utils/regex.js';
import { assertEventAccess } from '../utils/authz.js';

// Public: only published events, with computed remaining-capacity so the
// frontend never has to trust a client-side capacity count.
export const listPublicEvents = asyncHandler(async (req, res) => {
  const { category, q } = req.query;
  const filter = { status: 'published' };
  if (category && category !== 'All') filter.category = category;
  if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' };

  const events = await Event.find(filter).sort({ date: 1 });
  res.json({ events: await Promise.all(events.map(withRemaining)) });
});

// Admin/organizer: every event regardless of status — but an ORGANIZER
// (a client account) only ever sees events they created. Only ADMIN
// (the platform owner) sees across every organizer, which is what makes it
// safe to put multiple paying clients on one shared deployment.
export const listAdminEvents = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'ORGANIZER' ? { organizer: req.user.id } : {};
  const events = await Event.find(filter).sort({ date: 1 });

  // Attendance isn't a direct relation count filterable in the same query
  // (it's keyed off registration, not event, for the uniqueness guarantee),
  // so check-in counts are fetched in one grouped query and merged in.
  const checkIns = await Attendance.aggregate([{ $group: { _id: '$event', count: { $sum: 1 } } }]);
  const checkInMap = Object.fromEntries(checkIns.map((c) => [c._id.toString(), c.count]));

  const withCounts = await Promise.all(
    events.map(async (e) => ({ ...(await withRemaining(e)), checkedIn: checkInMap[e.id] || 0 }))
  );
  res.json({ events: withCounts });
});

export const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizer', 'name');
  if (!event) throw ApiError.notFound('Event not found.');
  res.json({ event: await withRemaining(event) });
});

export const createEvent = asyncHandler(async (req, res) => {
  eventValidators.upsert(req.body);
  // Anyone can self-serve a free event (Luma-style — no approval needed).
  // A *paid* event moves real Mobile Money through Campay, so that
  // specific case still requires being an approved ORGANIZER/ADMIN —
  // reusing the existing organizer-request vetting flow (see
  // requestOrganizerAccess in auth.controller.js) rather than letting any
  // brand-new account immediately start collecting payments.
  const price = Number(req.body.price) || 0;
  if (price > 0 && !['ADMIN', 'ORGANIZER'].includes(req.user.role)) {
    throw ApiError.forbidden('Creating a paid event requires an approved organizer account. Apply for organizer access from your profile — it only takes a moment.');
  }
  const data = pickEventFields(req.body);
  const event = await Event.create({ ...data, organizer: req.user.id });
  res.status(201).json({ event });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const existing = await Event.findById(req.params.id);
  if (!existing) throw ApiError.notFound('Event not found.');
  assertEventAccess(req.user, existing);
  eventValidators.upsert({ ...existing.toJSON(), ...req.body });
  const price = Number(req.body.price ?? existing.price) || 0;
  if (price > 0 && !['ADMIN', 'ORGANIZER'].includes(req.user.role)) {
    throw ApiError.forbidden('Turning this into a paid event requires an approved organizer account. Apply for organizer access from your profile.');
  }
  const data = pickEventFields(req.body, true);
  Object.assign(existing, data);
  const event = await existing.save();
  res.json({ event });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const existing = await Event.findById(req.params.id);
  if (!existing) throw ApiError.notFound('Event not found.');
  assertEventAccess(req.user, existing);
  await existing.deleteOne();
  res.status(204).end();
});

export const eventStatistics = asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const event = await Event.findById(eventId);
  if (!event) throw ApiError.notFound('Event not found.');
  assertEventAccess(req.user, event);

  const [registered, checkedIn] = await Promise.all([
    Registration.countDocuments({ event: eventId, status: 'confirmed' }),
    Attendance.countDocuments({ event: eventId }),
  ]);

  res.json({
    registered,
    checkedIn,
    notCheckedIn: registered - checkedIn,
    capacity: event.capacity,
    capacityUtilization: event.capacity ? Math.round((registered / event.capacity) * 100) : 0,
    attendanceRate: registered ? Math.round((checkedIn / registered) * 100) : 0,
  });
});

async function withRemaining(event) {
  const confirmed = await Registration.countDocuments({ event: event._id, status: 'confirmed' });
  return { ...event.toJSON(), registered: confirmed, remaining: Math.max(event.capacity - confirmed, 0) };
}

function pickEventFields(body, partial = false) {
  const fields = [
    'title', 'description', 'longDescription', 'image', 'category', 'date', 'startTime',
    'endTime', 'venue', 'capacity', 'registrationDeadline', 'status', 'contact', 'price', 'momoNumber',
    'timezone', 'registrationQuestions',
  ];
  const data = {};
  for (const f of fields) {
    if (body[f] === undefined) {
      if (partial) continue;
    } else {
      data[f] = body[f];
    }
  }
  if (data.capacity !== undefined) data.capacity = Number(data.capacity);
  if (data.price !== undefined) data.price = Number(data.price) || 0;
  if (data.date) data.date = new Date(data.date);
  if (data.registrationDeadline) data.registrationDeadline = new Date(data.registrationDeadline);
  if (data.registrationQuestions !== undefined) {
    data.registrationQuestions = sanitizeRegistrationQuestions(data.registrationQuestions);
  }
  return data;
}

// Never trust the client's question shape directly — drop anything without
// a usable label, coerce types to the two the frontend actually renders,
// and generate a stable id server-side for any question the organizer just
// added (so answers can reference it even before the event is saved).
function sanitizeRegistrationQuestions(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((q) => q && typeof q.label === 'string' && q.label.trim())
    .map((q, i) => ({
      id: (typeof q.id === 'string' && q.id.trim()) || `q_${Date.now().toString(36)}_${i}`,
      label: q.label.trim(),
      type: q.type === 'select' ? 'select' : 'text',
      options: q.type === 'select' && Array.isArray(q.options)
        ? q.options.filter((o) => o !== null && o !== undefined).map((o) => String(o).trim()).filter(Boolean)
        : undefined,
      required: !!q.required,
    }));
}
