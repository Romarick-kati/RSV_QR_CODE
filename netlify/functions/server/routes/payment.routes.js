import { Router } from 'express';
import * as rsvpController from '../controllers/rsvp.controller.js';

const router = Router();

// Public on purpose — Fapshi itself calls this, not a logged-in user, so it
// can't go behind requireAuth. See fapshiWebhook() in rsvp.controller.js
// for why this is still safe: it never trusts the call's payload for the
// actual payment decision, only for which transaction to re-verify
// directly with Fapshi.
router.get('/fapshi-webhook', rsvpController.fapshiWebhook);
router.post('/fapshi-webhook', rsvpController.fapshiWebhook);

// CamPay's webhook route is kept alongside Fapshi's rather than removed —
// campayWebhook() itself was removed from rsvp.controller.js when Fapshi
// became the active provider (see there for why), so these routes are
// disabled until/unless CamPay is reactivated. Left commented rather than
// deleted so switching back is a quick uncomment, not a rebuild.
// router.get('/campay-webhook', rsvpController.campayWebhook);
// router.post('/campay-webhook', rsvpController.campayWebhook);

export default router;
