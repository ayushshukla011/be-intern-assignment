import { Request, Response } from 'express';
import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { ActivityLog, ActivityType } from '../entities/ActivityLog';
import { User } from '../entities/User';
import { Post } from '../entities/Post';
import { Like } from '../entities/Like';
import { Follow } from '../entities/Follow';
import { validate } from '../utils/validator';
import { getUserActivitySchema } from '../validations/activityLog.validation';
import { AppDataSource } from '../data-source';

// Create repository constants
const userRepository = AppDataSource.getRepository(User);
const activityLogRepository = AppDataSource.getRepository(ActivityLog);
const postRepository = AppDataSource.getRepository(Post);
const likeRepository = AppDataSource.getRepository(Like);
const followRepository = AppDataSource.getRepository(Follow);

export const getUserActivity = async (req: Request, res: Response) => {
  console.log(`[ACTIVITY] Getting activity for user ID: ${req.params.id}`);
  try {
    const { error, value } = validate(getUserActivitySchema, { ...req.params, ...req.query });
    if (error) {
      console.log('[ACTIVITY] Validation error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    const { id, activityType, startDate, endDate, limit, offset } = value;
    console.log(`[ACTIVITY] Params: type=${activityType || 'all'}, startDate=${startDate || 'none'}, endDate=${endDate || 'none'}, limit=${limit}, offset=${offset}`);

    // Verify user exists
    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      console.log(`[ACTIVITY] User with ID ${id} not found`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Build query conditions
    const whereConditions: any = { userId: id };
    
    if (activityType) {
      whereConditions.activityType = activityType;
    }
    
    // Add date range filters if provided
    if (startDate && endDate) {
      whereConditions.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      whereConditions.createdAt = MoreThanOrEqual(startDate);
    } else if (endDate) {
      whereConditions.createdAt = LessThanOrEqual(endDate);
    }

    const [activities, count] = await activityLogRepository.findAndCount({
      where: whereConditions,
      skip: offset,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    console.log(`[ACTIVITY] Found ${activities.length} activities for user ${id} (total: ${count})`);

    // Format activities with more context
    const enrichedActivities = await Promise.all(activities.map(async (activity) => {
      let details = {};
      
      switch (activity.activityType) {
        case ActivityType.POST_CREATE:
          const post = await postRepository.findOne({ where: { id: activity.entityId } });
          details = { post };
          break;
        case ActivityType.POST_LIKE:
          const like = await likeRepository.findOne({ 
            where: { id: activity.entityId },
            relations: ['post']
          });
          details = { like };
          break;
        case ActivityType.USER_FOLLOW:
        case ActivityType.USER_UNFOLLOW:
          if (activity.activityType === ActivityType.USER_FOLLOW) {
            const follow = await followRepository.findOne({ 
              where: { id: activity.entityId },
              relations: ['followed']
            });
            details = { follow };
          } else {
            const followedUser = await userRepository.findOne({ 
              where: { id: activity.entityId } 
            });
            details = { followed: followedUser };
          }
          break;
      }
      
      return {
        id: activity.id,
        type: activity.activityType,
        createdAt: activity.createdAt,
        ...details
      };
    }));

    console.log(`[ACTIVITY] Enriched ${enrichedActivities.length} activities with details`);
    return res.json({
      data: enrichedActivities,
      meta: {
        total: count,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('[ACTIVITY] Error getting user activity:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 