import { Router } from 'express';
import { createLike, getLikes, getLikeById, getLikesByPost, deleteLike } from '../controllers/like.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication to all like routes
router.use(authenticate);

// CRUD Routes
router.post('/', createLike);
router.get('/', getLikes);
router.get('/:id', getLikeById);
router.get('/post/:postId', getLikesByPost);
router.delete('/:id', deleteLike);

export default router; 