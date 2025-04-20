import { Router } from 'express';
import { createFollow, getFollows, getFollowById, getFollowers, deleteFollow, getUserFollowers } from '../controllers/follow.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication to all follow routes
router.use(authenticate);

// CRUD Routes
router.post('/', createFollow);
router.get('/', getFollows);
router.get('/:id', getFollowById);
router.delete('/:id', deleteFollow);

// Special endpoint for getUserFollowers (fixed path)
router.get('/users/:id/followers', getUserFollowers);

export default router; 