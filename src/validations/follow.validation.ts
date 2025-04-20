import Joi from 'joi';

export const createFollowSchema = Joi.object({
  followedId: Joi.number().integer().positive().required()
});

export const deleteFollowSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const getFollowSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const getFollowersSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0)
});

export const getFollowingSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0)
}); 