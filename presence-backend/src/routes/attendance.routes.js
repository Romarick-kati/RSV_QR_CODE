import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller.js';
import * as rsvpController from '../controllers/rsvp.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { checkInLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// The scanner endpoint — organizer/admin only, since it's what turns a scan
// into a permanent attendance record.
router.post('/check-in', requireAuth, requireRole('ADMIN', 'ORGANIZER'), checkInLimiter, attendanceController.checkIn);
router.post('/manual/:registrationId', requireAuth, requireRole('ADMIN', 'ORGANIZER'), rsvpController.manualCheckIn);
router.post('/confirm-payment/:registrationId', requireAuth, requireRole('ADMIN', 'ORGANIZER'), rsvpController.confirmPayment);

export default router;
