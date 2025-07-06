// services/api-gateway/src/middleware/requestValidation.ts
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'];
    
    if (req.method !== 'GET' && req.method !== 'DELETE') {
      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        return res.status(400).json({
          success: false,
          error: `Content-Type must be one of: ${allowedTypes.join(', ')}`,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    next();
  };
};

export const validateRequestSize = (maxSize: number = 50 * 1024 * 1024) => { // 50MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        error: `Request size exceeds maximum allowed size of ${maxSize} bytes`,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
      timestamp: new Date().toISOString()
    });
  }
  next();
};

