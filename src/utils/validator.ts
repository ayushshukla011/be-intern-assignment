import { validate as validateMiddleware } from '../middlewares/validation.middleware';
import { ObjectSchema } from 'joi';

// This function will validate the data directly without being used as middleware
export const validate = (schema: ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data);
  return { error, value };
}; 