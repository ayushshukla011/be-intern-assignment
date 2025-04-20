import { Router } from 'express';
import { getFeed } from '../controllers/feed.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication
router.use(authenticate);

// Feed endpoint
router.get('/', getFeed);

export default router; 