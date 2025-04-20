import { Request, Response } from 'express';
import { Like } from '../entities/Like';
import { Post } from '../entities/Post';
import { ActivityLog, ActivityType } from '../entities/ActivityLog';
import { validate } from '../utils/validator';
import { createLikeSchema, deleteLikeSchema, getLikeSchema, getLikesByPostSchema, getLikesByUserSchema } from '../validations/like.validation';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppDataSource } from '../data-source';

// Use these repository constants
const likeRepository = AppDataSource.getRepository(Like);
const postRepository = AppDataSource.getRepository(Post);
const activityLogRepository = AppDataSource.getRepository(ActivityLog);

export const createLike = async (req: AuthRequest, res: Response) => {
  console.log('[LIKE] Creating new like');
  try {
    if (!req.user) {
      console.log('[LIKE] Authentication required');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { error, value } = validate(createLikeSchema, req.body);
    if (error) {
      console.log('[LIKE] Validation error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    const { postId } = value;
    const userId = req.user.id;
    console.log(`[LIKE] User ${userId} attempting to like post ${postId}`);

    // Check if post exists
    const post = await postRepository.findOne({ where: { id: postId } });
    if (!post) {
      console.log(`[LIKE] Post with ID ${postId} not found`);
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check if like already exists
    const existingLike = await likeRepository.findOne({ 
      where: { userId, postId } 
    });
    
    if (existingLike) {
      console.log(`[LIKE] User ${userId} already liked post ${postId}`);
      return res.status(400).json({ error: 'You have already liked this post' });
    }

    // Create the like
    const like = likeRepository.create({
      userId,
      postId
    });
    
    const savedLike = await likeRepository.save(like);
    console.log(`[LIKE] Like created with ID: ${savedLike.id}`);

    // Log activity
    const activity = activityLogRepository.create({
      userId,
      activityType: ActivityType.POST_LIKE,
      entityId: savedLike.id
    });
    await activityLogRepository.save(activity);

    return res.status(201).json(savedLike);
  } catch (error) {
    console.error('[LIKE] Error creating like:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLikes = async (req: Request, res: Response) => {
  console.log('[LIKE] Getting all likes');
  try {
    const likes = await likeRepository.find({
      relations: ['user', 'post']
    });

    console.log(`[LIKE] Retrieved ${likes.length} likes`);
    return res.json(likes);
  } catch (error) {
    console.error('[LIKE] Error getting likes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLikeById = async (req: Request, res: Response) => {
  console.log(`[LIKE] Getting like by ID: ${req.params.id}`);
  try {
    const { error, value } = validate(getLikeSchema, req.params);
    if (error) {
      console.log('[LIKE] Validation error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    const { id } = value;

    const like = await likeRepository.findOne({
      where: { id },
      relations: ['user', 'post']
    });

    if (!like) {
      console.log(`[LIKE] Like with ID ${id} not found`);
      return res.status(404).json({ error: 'Like not found' });
    }

    console.log(`[LIKE] Like with ID ${id} retrieved successfully`);
    return res.json(like);
  } catch (error) {
    console.error(`[LIKE] Error getting like ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLikesByPost = async (req: Request, res: Response) => {
  try {
    const { error, value } = validate(getLikesByPostSchema, req.query);
    if (error) return res.status(400).json({ error: error.message });

    const { postId, limit, offset } = value;

    const [likes, count] = await likeRepository.findAndCount({
      where: { postId },
      relations: ['user'],
      skip: offset,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    return res.json({
      data: likes,
      meta: {
        total: count,
        limit,
        offset
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteLike = async (req: AuthRequest, res: Response) => {
  console.log(`[LIKE] Deleting like with ID: ${req.params.id}`);
  try {
    if (!req.user) {
      console.log('[LIKE] Authentication required');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { error, value } = validate(deleteLikeSchema, req.params);
    if (error) {
      console.log('[LIKE] Validation error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    const { id } = value;
    const userId = req.user.id;

    const like = await likeRepository.findOne({ 
      where: { id } 
    });

    if (!like) {
      console.log(`[LIKE] Like with ID ${id} not found`);
      return res.status(404).json({ error: 'Like not found' });
    }

    if (like.userId !== userId) {
      console.log(`[LIKE] User ${userId} not authorized to delete like ${id}`);
      return res.status(403).json({ error: 'You can only delete your own likes' });
    }

    await likeRepository.remove(like);
    console.log(`[LIKE] Like with ID ${id} deleted successfully`);

    return res.status(204).send();
  } catch (error) {
    console.error(`[LIKE] Error deleting like ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 