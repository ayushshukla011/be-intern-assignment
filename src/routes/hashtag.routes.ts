import { Router } from 'express';
import { createHashtag, getHashtags, getHashtagById, getHashtagByName, deleteHashtag } from '../controllers/hashtag.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication to all hashtag routes
router.use(authenticate);

// CRUD Routes
router.post('/', createHashtag);
router.get('/', getHashtags);
router.get('/:id', getHashtagById);
router.get('/name/:name', getHashtagByName);
router.delete('/:id', deleteHashtag);

export default router; 