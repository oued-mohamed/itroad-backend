// services/document-service/src/controllers/healthController.ts
import { Request, Response } from 'express';
import { pool } from '../config/database';

export class HealthController {
  static check = async (req: Request, res: Response) => {
    try {
      // Check database connection
      let dbStatus = 'down';
      try {
        await pool.query('SELECT 1');
        dbStatus = 'up';
      } catch (error) {
        // Database is down
      }
      
      const health = {
        status: dbStatus === 'up' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'document-service',
        version: process.env.npm_package_version || '1.0.0',
        database: dbStatus,
        uptime: process.uptime()
      };
      
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        message: 'Service unavailable'
      });
    }
  };
}

// services/document-service/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};