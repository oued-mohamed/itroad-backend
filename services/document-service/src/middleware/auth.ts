// services/profile-service/src/middleware/auth.ts 
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';

export interface AuthRequest extends Request {
  user?: {
    adherantId: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access token required'
    });
    return;
  }

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as any;
    req.user = {
      adherantId: payload.adherantId,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName
    };
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
    return;
  }
};

