import { Router } from 'express';
import { getUserActivity } from '../controllers/activity.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication
router.use(authenticate);

// Activity endpoint
router.get('/users/:id/activity', getUserActivity);

export default router; 