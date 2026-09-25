import { Router } from 'express';
import authRoutes from './auth.routes.js';
import eventRoutes from './event.routes.js';
import userRoutes from './user.routes.js';
import attendanceRoutes from './attendance.routes.js';
import adminRoutes from './admin.routes.js';
import paymentRoutes from './payment.routes.js';
import notificationRoutes from './notification.routes.js';
import assistantRoutes from './assistant.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/users', userRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/admin', adminRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/assistant', assistantRoutes);

router.get('/', (req, res) => res.json({ name: 'Presence API', status: 'ok' }));

export default router;
