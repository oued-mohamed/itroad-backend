// services/auth-service/src/controllers/healthController.ts
import { Request, Response } from 'express';
import { pool } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

export class HealthController {
  static check = asyncHandler(async (req: Request, res: Response) => {
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
      service: 'auth-service',
      version: process.env.npm_package_version || '1.0.0',
      database: dbStatus,
      uptime: process.uptime()
    };
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  });
}