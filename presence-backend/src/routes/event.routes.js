import { Router } from 'express';
import * as eventController from '../controllers/event.controller.js';
import * as rsvpController from '../controllers/rsvp.controller.js';
import * as attendanceController from '../controllers/attendance.controller.js';
import { requireAuth, requireRole, attachUserIfPresent } from '../middleware/auth.js';

const router = Router();

// Public
router.get('/', attachUserIfPresent, eventController.listPublicEvents);
router.get('/:id', attachUserIfPresent, eventController.getEvent);

// Organizer / Admin
router.post('/', requireAuth, requireRole('ADMIN', 'ORGANIZER'), eventController.createEvent);
router.put('/:id', requireAuth, requireRole('ADMIN', 'ORGANIZER'), eventController.updateEvent);
router.delete('/:id', requireAuth, requireRole('ADMIN', 'ORGANIZER'), eventController.deleteEvent);
router.get('/:id/statistics', requireAuth, requireRole('ADMIN', 'ORGANIZER'), eventController.eventStatistics);
router.get('/:id/attendees', requireAuth, requireRole('ADMIN', 'ORGANIZER'), rsvpController.eventAttendees);
router.get('/:id/attendance', requireAuth, requireRole('ADMIN', 'ORGANIZER'), attendanceController.eventAttendance);

// Attendee RSVP
router.post('/:id/rsvp', requireAuth, rsvpController.rsvpToEvent);

export default router;
