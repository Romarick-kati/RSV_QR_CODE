import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', notificationController.listMine);
router.patch('/:id/read', notificationController.markMineRead);
router.patch('/read-all', notificationController.markAllMineRead);

export default router;
