import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import * as eventController from '../controllers/event.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN', 'ORGANIZER'));

router.get('/dashboard', adminController.dashboard);
router.get('/users', requireRole('ADMIN'), adminController.listUsers);
router.get('/events', eventController.listAdminEvents);
router.get('/registrations', adminController.allRegistrations);

export default router;
