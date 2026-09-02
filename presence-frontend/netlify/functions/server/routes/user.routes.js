import { Router } from 'express';
import * as rsvpController from '../controllers/rsvp.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/me/events', requireAuth, rsvpController.myRegistrations);
router.get('/me/registrations/:registrationId', requireAuth, rsvpController.getRegistration);
router.get('/me/registrations/:registrationId/payment-status', requireAuth, rsvpController.checkPaymentStatus);
router.delete('/me/registrations/:registrationId', requireAuth, rsvpController.cancelRsvp);

export default router;
