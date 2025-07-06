// services/api-gateway/src/utils/requestLogger.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

interface RequestWithTiming extends Request {
  startTime?: number;
}

export const requestLogger = (req: RequestWithTiming, res: Response, next: NextFunction) => {
  req.startTime = Date.now();
  
  // Log incoming request
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  });

  next();
};

