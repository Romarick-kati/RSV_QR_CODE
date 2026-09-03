import { Router } from 'express';
import authRoutes from './auth.routes.js';
import eventRoutes from './event.routes.js';
import userRoutes from './user.routes.js';
import attendanceRoutes from './attendance.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/users', userRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/admin', adminRoutes);

router.get('/', (req, res) => res.json({ name: 'Presence API', status: 'ok' }));

export default router;
