import { Router } from 'express';
import * as eventController from '../controllers/event.controller.js';
import * as rsvpController from '../controllers/rsvp.controller.js';
import * as attendanceController from '../controllers/attendance.controller.js';
import { requireAuth, requireRole, attachUserIfPresent } from '../middleware/auth.js';

const router = Router();

// Public
router.get('/', attachUserIfPresent, eventController.listPublicEvents);
router.get('/:id', attachUserIfPresent, eventController.getEvent);

// Any signed-in user can create/manage an event (Luma-style self-serve) —
// see the price>0 check inside createEvent/updateEvent, which still
// requires ADMIN/ORGANIZER for *paid* events specifically, since those
// move real Mobile Money through Campay and warrant the existing
// organizer-vetting flow. Ownership (isEventOwner in utils/authz.js)
// still restricts an ATTENDEE to only their own events, never anyone
// else's.
router.post('/', requireAuth, requireRole('ADMIN', 'ORGANIZER', 'ATTENDEE'), eventController.createEvent);
router.put('/:id', requireAuth, requireRole('ADMIN', 'ORGANIZER', 'ATTENDEE'), eventController.updateEvent);
router.delete('/:id', requireAuth, requireRole('ADMIN', 'ORGANIZER', 'ATTENDEE'), eventController.deleteEvent);
router.get('/:id/statistics', requireAuth, requireRole('ADMIN', 'ORGANIZER', 'ATTENDEE'), eventController.eventStatistics);
router.get('/:id/attendees', requireAuth, requireRole('ADMIN', 'ORGANIZER', 'ATTENDEE'), rsvpController.eventAttendees);
router.get('/:id/attendance', requireAuth, requireRole('ADMIN', 'ORGANIZER', 'ATTENDEE'), attendanceController.eventAttendance);

// Attendee RSVP
router.post('/:id/rsvp', requireAuth, rsvpController.rsvpToEvent);

export default router;
