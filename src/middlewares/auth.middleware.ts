import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
// Define a type for the authenticated request
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;  
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get the token from the header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Authentication failed: No token provided');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('Authentication failed: Token is empty');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
      // Verify the token
      const secret = process.env.JWT_SECRET || 'default_secret_please_change_in_production';
      console.log('Using secret:', secret.substring(0, 3) + '***');
      
      const decoded = jwt.verify(token, secret) as { id: number; email: string };
      console.log('Decoded token:', decoded);
      
      // Check if user exists in the database
      const userRepository = AppDataSource.getRepository(User);
      
      const user = userRepository.findOneBy({ id: decoded.id });    
      if (!user) {
        console.log(`User with id ${decoded.id} not found in database`);
        return res.status(401).json({ error: 'Invalid user' });
      }
      
      // Add user info to request
      req.user = {
        id: decoded.id,
        email: decoded.email
      };
      
      console.log(`Auth successful for user ${req.user.id}`);
      next();
    } catch (error) {
      console.log('Token verification failed:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};