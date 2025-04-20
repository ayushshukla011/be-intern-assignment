import { Request, Response } from 'express';
import { Follow } from '../entities/Follow';
import { User } from '../entities/User';
import { ActivityLog, ActivityType } from '../entities/ActivityLog';
import { validate } from '../utils/validator';
import { createFollowSchema, deleteFollowSchema, getFollowSchema, getFollowersSchema, getFollowingSchema } from '../validations/follow.validation';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppDataSource } from '../data-source';

// Use these repository constants
const followRepository = AppDataSource.getRepository(Follow);
const userRepository = AppDataSource.getRepository(User);
const activityLogRepository = AppDataSource.getRepository(ActivityLog);

export const createFollow = async (req: AuthRequest, res: Response) => {
  console.log('[FOLLOW] Creating new follow relationship');
  try {
    if (!req.user) {
      console.log('[FOLLOW] Authentication required');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { error, value } = validate(createFollowSchema, req.body);
    if (error) {
      console.log('[FOLLOW] Validation error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    const { followedId } = value;
    const followerId = req.user.id;
    console.log(`[FOLLOW] User ${followerId} attempting to follow user ${followedId}`);

    // Prevent self-follow
    if (followerId === followedId) {
      console.log('[FOLLOW] Self-follow attempt prevented');
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    // Check if followed user exists
    const followedUser = await userRepository.findOne({ where: { id: followedId } });
    if (!followedUser) {
      return res.status(404).json({ error: 'User to follow not found' });
    }
    
    // Check if already following
    const existingFollow = await followRepository.findOne({ 
      where: { followerId, followedId } 
    });
    
    if (existingFollow) {
      return res.status(400).json({ error: 'You are already following this user' });
    }

    // Create the follow relationship
    const follow = followRepository.create({
      followerId,
      followedId
    });
    
    const savedFollow = await followRepository.save(follow);

    // Log activity
    const activity = activityLogRepository.create({
      userId: followerId,
      activityType: ActivityType.USER_FOLLOW,
      entityId: savedFollow.id
    });
    await activityLogRepository.save(activity);

    console.log(`[FOLLOW] Follow relationship created with ID: ${savedFollow.id}`);
    return res.status(201).json(savedFollow);
  } catch (error) {
    console.error('[FOLLOW] Error creating follow relationship:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFollows = async (req: Request, res: Response) => {
  console.log('[FOLLOW] Getting all follow relationships');
  try {
    const follows = await followRepository.find({
      relations: ['follower', 'followed']
    });

    console.log(`[FOLLOW] Retrieved ${follows.length} follow relationships`);
    return res.json(follows);
  } catch (error) {
    console.error('[FOLLOW] Error getting follow relationships:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFollowById = async (req: Request, res: Response) => {
  console.log(`[FOLLOW] Getting follow relationship by ID: ${req.params.id}`);
  try {
    const { error, value } = validate(getFollowSchema, req.params);
    if (error) return res.status(400).json({ error: error.message });

    const { id } = value;

    const follow = await followRepository.findOne({
      where: { id },
      relations: ['follower', 'followed']
    });

    if (!follow) {
      console.log(`[FOLLOW] Follow relationship with ID ${id} not found`);
      return res.status(404).json({ error: 'Follow relationship not found' });
    }

    console.log(`[FOLLOW] Follow relationship with ID ${id} retrieved`);
    return res.json(follow);
  } catch (error) {
    console.error(`[FOLLOW] Error getting follow relationship ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const { error, value } = validate(getFollowersSchema, req.params);
    if (error) return res.status(400).json({ error: error.message });

    const { id } = value;
    const { limit, offset } = req.query;

    // Validate limit and offset
    const parsedLimit = parseInt(limit as string) || 10;
    const parsedOffset = parseInt(offset as string) || 0;

    const [follows, count] = await followRepository.findAndCount({
      where: { followedId: id },
      relations: ['follower'],
      skip: parsedOffset,
      take: parsedLimit,
      order: { createdAt: 'DESC' }
    });

    // Format the response
    const followers = follows.map(follow => ({
      id: follow.id,
      user: follow.follower,
      followedAt: follow.createdAt
    }));

    return res.json({
      data: followers,
      meta: {
        total: count,
        limit: parsedLimit,
        offset: parsedOffset
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteFollow = async (req: AuthRequest, res: Response) => {
  console.log(`[FOLLOW] Deleting follow relationship with ID: ${req.params.id}`);
  try {
    if (!req.user) {
      console.log('[FOLLOW] Authentication required');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { error, value } = validate(deleteFollowSchema, req.params);
    if (error) return res.status(400).json({ error: error.message });

    const { id } = value;
    const userId = req.user.id;

    const follow = await followRepository.findOne({ 
      where: { id } 
    });

    if (!follow) {
      console.log(`[FOLLOW] Follow relationship with ID ${id} not found`);
      return res.status(404).json({ error: 'Follow relationship not found' });
    }

    if (follow.followerId !== userId) {
      console.log(`[FOLLOW] User ${userId} not authorized to delete follow relationship ${id}`);
      return res.status(403).json({ error: 'You can only unfollow users that you follow' });
    }

    // Log activity before removing the follow
    const activity = activityLogRepository.create({
      userId,
      activityType: ActivityType.USER_UNFOLLOW,
      entityId: follow.followedId
    });
    await activityLogRepository.save(activity);

    await followRepository.remove(follow);

    console.log(`[FOLLOW] Follow relationship with ID ${id} deleted successfully`);
    return res.status(204).send();
  } catch (error) {
    console.error(`[FOLLOW] Error deleting follow relationship ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserFollowers = async (req: Request, res: Response) => {
  try {
    const { error, value } = validate(getFollowersSchema, { ...req.params, ...req.query });
    if (error) return res.status(400).json({ error: error.message });

    const { id } = value;
    const { limit, offset } = value;

    // Verify user exists
    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [follows, count] = await followRepository.findAndCount({
      where: { followedId: id },
      relations: ['follower'],
      skip: offset,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    // Format the response
    const followers = follows.map(follow => ({
      id: follow.id,
      user: follow.follower,
      followedAt: follow.createdAt
    }));

    return res.json({
      data: followers,
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