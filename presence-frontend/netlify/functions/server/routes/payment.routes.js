import { Router } from 'express';
import * as rsvpController from '../controllers/rsvp.controller.js';

const router = Router();

// Public on purpose — CamPay itself calls this, not a logged-in user, so it
// can't go behind requireAuth. See campayWebhook() in rsvp.controller.js
// for why this is still safe: it never trusts the call's payload for the
// actual payment decision, only for which transaction to re-verify
// directly with CamPay. CamPay's dashboard webhook config shows a GET/POST
// method dropdown, so both are accepted here.
router.get('/campay-webhook', rsvpController.campayWebhook);
router.post('/campay-webhook', rsvpController.campayWebhook);

export default router;
