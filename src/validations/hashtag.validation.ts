import Joi from 'joi';

export const createHashtagSchema = Joi.object({
  name: Joi.string().pattern(/^[a-zA-Z0-9_]+$/).required().min(1).max(50)
});

export const getHashtagSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const getHashtagByNameSchema = Joi.object({
  name: Joi.string().pattern(/^[a-zA-Z0-9_]+$/).required()
});

export const getPostsByHashtagSchema = Joi.object({
  tag: Joi.string().pattern(/^[a-zA-Z0-9_]+$/).required(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0)
});

export const deleteHashtagSchema = Joi.object({
  id: Joi.number().integer().positive().required()
}); 