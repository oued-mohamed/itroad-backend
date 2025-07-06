// services/api-gateway/src/controllers/gatewayController.ts
import { Request, Response } from 'express';
import { HealthService } from '../services/healthService';
import { ProxyService } from '../services/proxyService';
import { formatSuccessResponse, formatErrorResponse } from '../utils/responseFormatter';
import { asyncHandler } from '../middleware/errorHandler';

export class GatewayController {
  // Health check for the gateway itself
  static getGatewayHealth = asyncHandler(async (req: Request, res: Response) => {
    const health = {
      status: 'healthy',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env['npm_package_version'] || '1.0.0'
    };
    
    res.json(formatSuccessResponse(health));
  });

  // Aggregated health check for all services
  static getAllServicesHealth = asyncHandler(async (req: Request, res: Response) => {
    const healthData = await HealthService.checkAllServices();
    
    const statusCode = healthData.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(formatSuccessResponse(healthData));
  });

  // Service discovery endpoint
  static getServiceDiscovery = asyncHandler(async (req: Request, res: Response) => {
    const healthData = await HealthService.checkAllServices();
    
    const discoveryData = {
      gateway: {
        status: 'healthy',
        version: process.env['npm_package_version'] || '1.0.0',
        uptime: process.uptime()
      },
      services: healthData.services.reduce((acc, service) => {
        acc[service.name] = {
          status: service.status,
          responseTime: service.responseTime,
          lastChecked: service.lastChecked
        };
        return acc;
      }, {} as Record<string, any>),
      timestamp: new Date().toISOString()
    };
    
    res.json(formatSuccessResponse(discoveryData));
  });

  // Auth service proxy methods
  static proxyAuthRequest = asyncHandler(async (req: Request, res: Response) => {
    await ProxyService.proxyRequest(req, res, 'auth', '/api/auth');
  });

  // Profile service proxy methods
  static proxyProfileRequest = asyncHandler(async (req: Request, res: Response) => {
    await ProxyService.proxyRequest(req, res, 'profile', '/api/profile');
  });

  // Document service proxy methods
  static proxyDocumentRequest = asyncHandler(async (req: Request, res: Response) => {
    await ProxyService.proxyRequest(req, res, 'document', '/api/documents');
  });
}