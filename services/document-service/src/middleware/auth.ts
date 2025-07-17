// services/document-service/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

// Extend Request interface to include user data
export interface AuthRequest extends Request {
  user?: {
    adherantId: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

// JWT payload interface
interface JwtPayload {
  adherantId: string;
  email: string;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logger.warn(`Authentication failed: No token provided - ${req.ip} - ${req.originalUrl}`);
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Access token required'
    });
    return;
  }

  try {
    // Verify JWT token
    const payload = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    
    // Validate payload structure
    if (!payload.adherantId || !payload.email) {
      logger.warn(`Authentication failed: Invalid token payload - ${req.ip}`);
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Invalid token payload'
      });
      return;
    }

    // Attach user info to request
    req.user = {
      adherantId: payload.adherantId,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName
    };

    logger.debug(`User authenticated: ${payload.email} (${payload.adherantId})`);
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn(`Authentication failed: Token expired - ${req.ip}`);
      res.status(403).json({
        success: false,
        error: 'Token Expired',
        message: 'Token has expired'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn(`Authentication failed: Invalid token - ${req.ip} - ${error.message}`);
      res.status(403).json({
        success: false,
        error: 'Invalid Token',
        message: 'Invalid or malformed token'
      });
    } else {
      logger.error(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({
        success: false,
        error: 'Authentication Error',
        message: 'Token verification failed'
      });
    }
    return;
  }
};

// Optional middleware for optional authentication (some routes might be public)
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided, continue without auth
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    
    if (payload.adherantId && payload.email) {
      req.user = {
        adherantId: payload.adherantId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName
      };
    }
  } catch (error) {
    // Invalid token, but continue anyway (optional auth)
    logger.debug(`Optional auth failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  next();
};

// Middleware to check if user owns the document (for update/delete operations)
export const checkDocumentOwnership = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required'
    });
    return;
  }

  // This will be implemented in the document controller
  // For now, just pass through
  next();
};
console.log('🔍 JWT Secret being used:', config.JWT_SECRET);
