import { Router } from 'express';
import { createPost, getPosts, getPostById, updatePost, deletePost, getPostsByHashtag } from '../controllers/post.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication to all post routes
router.use(authenticate);

// CRUD Routes
router.post('/', createPost);
router.get('/', getPosts);
router.get('/:id', getPostById);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

// Add hashtag endpoint
router.get('/hashtag/:tag', getPostsByHashtag);

export default router; 