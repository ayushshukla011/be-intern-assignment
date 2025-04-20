import { Request, Response } from 'express';
import { In } from 'typeorm';
import { Post } from '../entities/Post';
import { Hashtag } from '../entities/Hashtag';
import { PostHashtag } from '../entities/PostHashtag';
import { ActivityLog, ActivityType } from '../entities/ActivityLog';
import { validate } from '../utils/validator';
import { createPostSchema, updatePostSchema, getPostSchema, deletePostSchema, paginationSchema, getPostsByHashtagSchema } from '../validations/post.validation';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppDataSource } from '../data-source';

// Use these repository constants instead of getRepository in each function
const postRepository = AppDataSource.getRepository(Post);
const hashtagRepository = AppDataSource.getRepository(Hashtag);
const postHashtagRepository = AppDataSource.getRepository(PostHashtag);
const activityLogRepository = AppDataSource.getRepository(ActivityLog);

export const createPost = async (req: AuthRequest, res: Response) => {
  console.log('[POST] Creating new post');
  try {
    const { error, value } = validate(createPostSchema, req.body);
    if (error) {
      console.log('[POST] Validation error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    if (!req.user) {
      console.log('[POST] Authentication required');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { content, hashtags } = value;
    const userId = req.user.id;
    console.log(`[POST] Creating post for user ${userId} with hashtags:`, hashtags);

    // Create post - using the repository constants
    const post = postRepository.create({
      content,
      userId
    });
    
    const savedPost = await postRepository.save(post);

    // Process hashtags if provided
    if (hashtags && hashtags.length > 0) {
      for (const tagName of hashtags) {
        // Find or create hashtag
        let hashtag = await hashtagRepository.findOne({ where: { name: tagName } });
        if (!hashtag) {
          hashtag = hashtagRepository.create({ name: tagName });
          hashtag = await hashtagRepository.save(hashtag);
        }

        // Create post-hashtag relationship
        const postHashtag = postHashtagRepository.create({
          postId: savedPost.id,
          hashtagId: hashtag.id
        });
        await postHashtagRepository.save(postHashtag);
      }
    }

    // Log activity
    const activity = activityLogRepository.create({
      userId,
      activityType: ActivityType.POST_CREATE,
      entityId: savedPost.id
    });
    await activityLogRepository.save(activity);

    console.log(`[POST] Post created successfully with ID: ${savedPost.id}`);
    return res.status(201).json(savedPost);
  } catch (error) {
    console.error('[POST] Error creating post:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPosts = async (req: Request, res: Response) => {
  console.log('[POST] Getting all posts');
  try {
    const { error, value } = validate(paginationSchema, req.query);
    if (error) return res.status(400).json({ error: error.message });

    const { limit, offset } = value;

    const [posts, count] = await postRepository.findAndCount({
      relations: ['user', 'likes', 'postHashtags', 'postHashtags.hashtag'],
      skip: offset,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    // Transform response to include hashtags directly
    const formattedPosts = posts.map(post => {
      const hashtags = post.postHashtags.map(ph => ph.hashtag.name);
      const { postHashtags, ...restPost } = post;
      return {
        ...restPost,
        hashtags,
        likeCount: post.likes.length
      };
    });

    console.log(`[POST] Retrieved ${posts.length} posts`);
    return res.json({
      data: formattedPosts,
      meta: {
        total: count,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('[POST] Error getting posts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  console.log(`[POST] Getting post by ID: ${req.params.id}`);
  try {
    const { error, value } = validate(getPostSchema, req.params);
    if (error) return res.status(400).json({ error: error.message });

    const { id } = value;

    const post = await postRepository.findOne({
      where: { id },
      relations: ['user', 'likes', 'postHashtags', 'postHashtags.hashtag']
    });

    if (!post) {
      console.log(`[POST] Post with ID ${id} not found`);
      return res.status(404).json({ error: 'Post not found' });
    }

    // Transform response to include hashtags directly
    const hashtags = post.postHashtags.map(ph => ph.hashtag.name);
    const { postHashtags, ...restPost } = post;
    const formattedPost = {
      ...restPost,
      hashtags,
      likeCount: post.likes.length
    };

    console.log(`[POST] Post with ID ${id} retrieved successfully`);
    return res.json(formattedPost);
  } catch (error) {
    console.error(`[POST] Error getting post ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePost = async (req: AuthRequest, res: Response) => {
  console.log(`[POST] Updating post with ID: ${req.params.id}`);
  try {
    if (!req.user) {
      console.log('[POST] Authentication required');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { error: paramsError, value: paramsValue } = validate(getPostSchema, req.params);
    if (paramsError) return res.status(400).json({ error: paramsError.message });

    const { error: bodyError, value: bodyValue } = validate(updatePostSchema, req.body);
    if (bodyError) return res.status(400).json({ error: bodyError.message });

    const { id } = paramsValue;
    const { content } = bodyValue;
    const userId = req.user.id;

    const post = await postRepository.findOne({ where: { id } });

    if (!post) {
      console.log(`[POST] Post with ID ${id} not found`);
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== userId) {
      console.log(`[POST] User ${userId} not authorized to update post ${id}`);
      return res.status(403).json({ error: 'You can only update your own posts' });
    }

    post.content = content;
    const updatedPost = await postRepository.save(post);

    console.log(`[POST] Post with ID ${id} updated successfully`);
    return res.json(updatedPost);
  } catch (error) {
    console.error(`[POST] Error updating post ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  console.log(`[POST] Deleting post with ID: ${req.params.id}`);
  try {
    if (!req.user) {
      console.log('[POST] Authentication required');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { error, value } = validate(deletePostSchema, req.params);
    if (error) return res.status(400).json({ error: error.message });

    const { id } = value;
    const userId = req.user.id;

    const post = await postRepository.findOne({ where: { id } });

    if (!post) {
      console.log(`[POST] Post with ID ${id} not found`);
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== userId) {
      console.log(`[POST] User ${userId} not authorized to delete post ${id}`);
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }

    await postRepository.remove(post);

    console.log(`[POST] Post with ID ${id} deleted successfully`);
    return res.status(204).send();
  } catch (error) {
    console.error(`[POST] Error deleting post ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPostsByHashtag = async (req: Request, res: Response) => {
  console.log(`[POST] Getting posts by hashtag: ${req.params.tag}`);
  try {
    const { error, value } = validate(getPostsByHashtagSchema, { ...req.params, ...req.query });
    if (error) return res.status(400).json({ error: error.message });

    const { tag, limit, offset } = value;

    // Find hashtag (case insensitive)
    const hashtag = await hashtagRepository.findOne({
      where: { name: tag.toLowerCase() }
    });

    if (!hashtag) {
      console.log(`[POST] Hashtag "${tag}" not found`);
      return res.json({
        data: [],
        meta: {
          total: 0,
          limit,
          offset
        }
      });
    }

    // Find posts with this hashtag
    const postHashtags = await postHashtagRepository.find({
      where: { hashtagId: hashtag.id },
      relations: ['post']
    });

    const postIds = postHashtags.map(ph => ph.postId);

    if (postIds.length === 0) {
      return res.json({
        data: [],
        meta: {
          total: 0,
          limit,
          offset
        }
      });
    }

    // Fetch the actual posts with all relations
    const [posts, count] = await postRepository.findAndCount({
      where: { id: In(postIds) },
      relations: ['user', 'likes', 'postHashtags', 'postHashtags.hashtag'],
      skip: offset,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    // Transform response
    const formattedPosts = posts.map(post => {
      const hashtags = post.postHashtags.map(ph => ph.hashtag.name);
      const { postHashtags, ...restPost } = post;
      return {
        ...restPost,
        hashtags,
        likeCount: post.likes.length
      };
    });

    console.log(`[POST] Found ${posts.length} posts with hashtag "${tag}"`);
    return res.json({
      data: formattedPosts,
      meta: {
        total: count,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error(`[POST] Error getting posts by hashtag ${req.params.tag}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 