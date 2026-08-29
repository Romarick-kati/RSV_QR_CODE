import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import * as eventController from '../controllers/event.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN', 'ORGANIZER'));

router.get('/dashboard', adminController.dashboard);
router.get('/users', requireRole('ADMIN'), adminController.listUsers);
router.post('/users', requireRole('ADMIN'), adminController.createUser);
router.patch('/users/:id', requireRole('ADMIN'), adminController.updateUser);
router.delete('/users/:id', requireRole('ADMIN'), adminController.deleteUser);
router.get('/organizer-requests', requireRole('ADMIN'), adminController.listOrganizerRequests);
router.post('/organizer-requests/:id/approve', requireRole('ADMIN'), adminController.approveOrganizerRequest);
router.post('/organizer-requests/:id/reject', requireRole('ADMIN'), adminController.rejectOrganizerRequest);
router.get('/notifications', adminController.listNotifications);
router.patch('/notifications/:id/read', adminController.markNotificationRead);
router.patch('/notifications/read-all', adminController.markAllNotificationsRead);
router.get('/events', eventController.listAdminEvents);
router.get('/registrations', adminController.allRegistrations);

export default router;
