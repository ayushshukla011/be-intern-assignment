import Joi from 'joi';

export const createPostSchema = Joi.object({
  content: Joi.string().required().min(1).max(2000),
  hashtags: Joi.array().items(Joi.string().pattern(/^[a-zA-Z0-9_]+$/)).optional()
});

export const updatePostSchema = Joi.object({
  content: Joi.string().min(1).max(2000)
});

export const getPostSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const deletePostSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0)
});

export const getPostsByHashtagSchema = Joi.object({
  tag: Joi.string().pattern(/^[a-zA-Z0-9_]+$/).required(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0)
}); 