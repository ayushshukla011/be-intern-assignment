import Joi from 'joi';
import { ActivityType } from '../entities/ActivityLog';

export const getUserActivitySchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  activityType: Joi.string().valid(...Object.values(ActivityType)).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0)
}); 