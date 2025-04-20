import Joi from 'joi';

export const createLikeSchema = Joi.object({
  postId: Joi.number().integer().positive().required()
});

export const deleteLikeSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const getLikeSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const getLikesByPostSchema = Joi.object({
  postId: Joi.number().integer().positive().required(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0)
});

export const getLikesByUserSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0)
}); 