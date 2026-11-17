import { Router } from 'express';
import * as assistantController from '../controllers/assistant.controller.js';
import { assistantLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/chat', assistantLimiter, assistantController.chat);

export default router;
