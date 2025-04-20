import { Request, Response } from 'express';
import { In } from 'typeorm';
import { Post } from '../entities/Post';
import { Follow } from '../entities/Follow';
import { validate } from '../utils/validator';
import { getFeedSchema } from '../validations/feed.validation';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppDataSource } from '../data-source';

// Create repository constants
const postRepository = AppDataSource.getRepository(Post);
const followRepository = AppDataSource.getRepository(Follow);

export const getFeed = async (req: AuthRequest, res: Response) => {
  console.log('[FEED] Getting user feed');
  try {
    if (!req.user) {
      console.log('[FEED] Authentication required');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { error, value } = validate(getFeedSchema, req.query);
    if (error) {
      console.log('[FEED] Validation error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    const { limit, offset } = value;
    const userId = req.user.id;
    console.log(`[FEED] Getting feed for user ${userId} with limit ${limit}, offset ${offset}`);

    // Get IDs of users that the current user follows
    const follows = await followRepository.find({
      where: { followerId: userId },
      select: ['followedId']
    });
    
    const followedUserIds = follows.map(follow => follow.followedId);
    
    // Include user's own posts in feed
    followedUserIds.push(userId);
    console.log(`[FEED] Getting posts from users: ${[...followedUserIds]}`);
    
    // If user doesn't follow anyone and somehow doesn't include self, return empty result
    if (followedUserIds.length === 0) {
      console.log('[FEED] No followed users found, returning empty feed');
      return res.json({
        data: [],
        meta: {
          total: 0,
          limit,
          offset
        }
      });
    }

    // Fetch posts from followed users
    const [posts, count] = await postRepository.findAndCount({
      where: { userId: In(followedUserIds) },
      relations: ['user', 'likes', 'postHashtags', 'postHashtags.hashtag'],
      skip: offset,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    console.log(`[FEED] Found ${posts.length} posts for feed (total: ${count})`);

    // Transform response to include hashtags directly and count likes
    const formattedPosts = posts.map(post => {
      const hashtags = post.postHashtags.map(ph => ph.hashtag.name);
      const { postHashtags, ...restPost } = post;
      return {
        ...restPost,
        hashtags,
        likeCount: post.likes.length
      };
    });

    return res.json({
      data: formattedPosts,
      meta: {
        total: count,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('[FEED] Error getting user feed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 