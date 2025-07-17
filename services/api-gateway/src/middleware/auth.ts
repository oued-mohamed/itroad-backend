// services/api-gateway/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios, { AxiosError } from 'axios';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface JwtPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Cache for user data to reduce auth service calls
const userCache = new Map<string, { user: any; expiry: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
      
      // Check cache first
      const cacheKey = `user:${decoded.userId}`;
      const cachedUser = userCache.get(cacheKey);
      
      if (cachedUser && cachedUser.expiry > Date.now()) {
        req.user = cachedUser.user;
        return next();
      }

      // Verify user with auth service
      let userData;
      try {
        const authResponse = await axios.get(`${config.AUTH_SERVICE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: 5000
        });

        userData = {
          userId: authResponse.data.data.id,
          email: authResponse.data.data.email,
          firstName: authResponse.data.data.firstName,
          lastName: authResponse.data.data.lastName,
          role: authResponse.data.data.role
        };

        // Cache the user data
        userCache.set(cacheKey, {
          user: userData,
          expiry: Date.now() + CACHE_DURATION
        });

      } catch (authError) {
        const axiosError = authError as AxiosError;
        
        if (axiosError.response?.status === 401) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            error: 'INVALID_TOKEN'
          });
        }

        // If auth service is down, fall back to JWT data (less secure but maintains availability)
        logger.warn('Auth service unavailable, falling back to JWT data', {
          error: axiosError.message,
          userId: decoded.userId
        });

        userData = {
          userId: decoded.userId,
          email: decoded.email,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
          role: decoded.role
        };
      }

      req.user = userData;
      next();

    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          error: 'TOKEN_EXPIRED'
        });
      }

      if (jwtError instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format',
          error: 'INVALID_TOKEN_FORMAT'
        });
      }

      throw jwtError;
    }

  } catch (error) {
    logger.error('Authentication middleware error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      message: 'Authentication service error',
      error: 'AUTH_SERVICE_ERROR'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Access denied - insufficient permissions', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: roles,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireAgent = requireRole(['admin', 'agent']);
export const requireClient = requireRole(['admin', 'agent', 'client']);

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
      
      // Check cache first
      const cacheKey = `user:${decoded.userId}`;
      const cachedUser = userCache.get(cacheKey);
      
      if (cachedUser && cachedUser.expiry > Date.now()) {
        req.user = cachedUser.user;
        return next();
      }

      // Try to verify with auth service
      try {
        const authResponse = await axios.get(`${config.AUTH_SERVICE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: 3000 // Shorter timeout for optional auth
        });

        const userData = {
          userId: authResponse.data.data.id,
          email: authResponse.data.data.email,
          firstName: authResponse.data.data.firstName,
          lastName: authResponse.data.data.lastName,
          role: authResponse.data.data.role
        };

        // Cache the user data
        userCache.set(cacheKey, {
          user: userData,
          expiry: Date.now() + CACHE_DURATION
        });

        req.user = userData;
      } catch (authError) {
        // Silently fail for optional auth
        logger.debug('Optional auth failed', {
          error: authError instanceof Error ? authError.message : 'Unknown error',
          userId: decoded.userId
        });
      }
    } catch (jwtError) {
      // Silently fail for optional auth
      logger.debug('Optional JWT verification failed', {
        error: jwtError instanceof Error ? jwtError.message : 'Unknown error'
      });
    }

    next();
  } catch (error) {
    // Don't fail the request for optional auth
    logger.debug('Optional authentication error:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next();
  }
};

// Service-to-service authentication
export const serviceAuth = (req: Request, res: Response, next: NextFunction) => {
  const serviceToken = req.headers['x-service-token'] as string;
  const serviceName = req.headers['x-service-name'] as string;

  if (!serviceToken || !serviceName) {
    return res.status(401).json({
      success: false,
      message: 'Service authentication required',
      error: 'MISSING_SERVICE_AUTH'
    });
  }

  // Define service tokens here since they're not in your config
  const SERVICE_TOKENS: Record<string, string> = {
    'auth-service': process.env['AUTH_SERVICE_TOKEN'] || 'auth-service-secret-token',
    'profile-service': process.env['PROFILE_SERVICE_TOKEN'] || 'profile-service-secret-token',
    'property-service': process.env['PROPERTY_SERVICE_TOKEN'] || 'property-service-secret-token',
    'document-service': process.env['DOCUMENT_SERVICE_TOKEN'] || 'document-service-secret-token',
    'transaction-service': process.env['TRANSACTION_SERVICE_TOKEN'] || 'transaction-service-secret-token',
  };

  // Verify service token (you should use a more secure method in production)
  const expectedToken = SERVICE_TOKENS[serviceName];
  
  if (!expectedToken || serviceToken !== expectedToken) {
    logger.warn('Invalid service authentication attempt', {
      serviceName,
      token: serviceToken.substring(0, 8) + '...',
      ip: req.ip
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid service credentials',
      error: 'INVALID_SERVICE_AUTH'
    });
  }

  // Add service info to request
  (req as any).service = {
    name: serviceName,
    authenticated: true
  };

  next();
};

// Rate limiting per user
const userRateLimits = new Map<string, { count: number; resetTime: number }>();

export const userRateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const identifier = req.user?.userId || req.ip || 'unknown'; // Fixed undefined issue
    const now = Date.now();
    
    const userLimit = userRateLimits.get(identifier);
    
    if (!userLimit || now > userLimit.resetTime) {
      // Reset or create new limit
      userRateLimits.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
      
      return next();
    }
    
    if (userLimit.count >= maxRequests) {
      const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
      
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', new Date(userLimit.resetTime).toISOString());
      res.setHeader('Retry-After', retryAfter);
      
      logger.warn('Rate limit exceeded', {
        userId: req.user?.userId,
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter
      });
    }
    
    userLimit.count++;
    
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - userLimit.count);
    res.setHeader('X-RateLimit-Reset', new Date(userLimit.resetTime).toISOString());
    
    next();
  };
};

// API Key authentication for public endpoints
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required',
      error: 'MISSING_API_KEY'
    });
  }

  // Verify API key (implement your API key validation logic)
  if (!isValidApiKey(apiKey)) {
    logger.warn('Invalid API key attempt', {
      apiKey: apiKey.substring(0, 8) + '...',
      ip: req.ip,
      path: req.path
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid API key',
      error: 'INVALID_API_KEY'
    });
  }

  // Add API key info to request
  (req as any).apiKey = {
    key: apiKey,
    authenticated: true
  };

  next();
};

// Utility function to validate API keys
const isValidApiKey = (apiKey: string): boolean => {
  // Implement your API key validation logic here
  // This could involve checking against a database, cache, or external service
  const VALID_API_KEYS = process.env['VALID_API_KEYS']?.split(',') || ['demo-api-key-123', 'test-api-key-456'];
  return VALID_API_KEYS.includes(apiKey);
};

// Permission-based access control
export const requirePermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
    }

    try {
      // Check user permissions via auth service
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'Authorization header required',
          error: 'MISSING_AUTH_HEADER'
        });
      }

      const permissionResponse = await axios.get(
        `${config.AUTH_SERVICE_URL}/api/auth/permissions/${req.user.userId}`,
        {
          headers: {
            Authorization: authHeader // Fixed undefined issue
          },
          timeout: 3000
        }
      );

      const userPermissions = permissionResponse.data.data.permissions || [];
      
      if (!userPermissions.includes(permission)) {
        logger.warn('Permission denied', {
          userId: req.user.userId,
          requiredPermission: permission,
          userPermissions,
          endpoint: req.originalUrl
        });

        return res.status(403).json({
          success: false,
          message: 'Permission denied',
          error: 'PERMISSION_DENIED',
          required: permission
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user.userId,
        permission
      });

      return res.status(500).json({
        success: false,
        message: 'Permission verification failed',
        error: 'PERMISSION_CHECK_FAILED'
      });
    }
  };
};

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (value.expiry <= now) {
      userCache.delete(key);
    }
  }
  for (const [key, value] of userRateLimits.entries()) {
    if (value.resetTime <= now) {
      userRateLimits.delete(key);
    }
  }
}, 60000); // Clean up every minute

// Middleware to log authentication events
export const logAuthEvents = (req: AuthRequest, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    if (req.user || req.headers.authorization) {
      logger.info('Authentication event', {
        userId: req.user?.userId,
        email: req.user?.email,
        role: req.user?.role,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        authenticated: !!req.user
      });
    }
  });
  
  next();
};

// Export all middleware functions
export default {
  authMiddleware,
  requireRole,
  requireAdmin,
  requireAgent,
  requireClient,
  optionalAuth,
  serviceAuth,
  userRateLimit,
  apiKeyAuth,
  requirePermission,
  logAuthEvents
};