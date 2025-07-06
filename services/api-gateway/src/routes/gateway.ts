// services/api-gateway/src/routes/gateway.ts
import { Router, Request, Response } from 'express';
import { ServiceDiscovery } from '../config/services';
import { asyncHandler, createError } from '../middleware/errorHandler';
import logger from '../config/logger';

const router = Router();

// Proxy utility function
const proxyRequest = async (req: Request, res: Response, serviceName: string, path: string = '') => {
  const serviceUrl = ServiceDiscovery.getServiceUrl(serviceName);
  
  if (!serviceUrl) {
    throw createError(`Service ${serviceName} not found`, 404);
  }

  // Check service health
  const isHealthy = await ServiceDiscovery.checkServiceHealth(serviceName);
  if (!isHealthy) {
    throw createError(`Service ${serviceName} is unavailable`, 503);
  }

  const targetUrl = `${serviceUrl}${path}${req.url}`;
  
  logger.info(`Proxying request: ${req.method} ${req.originalUrl} -> ${targetUrl}`);

  try {
    const headers: Record<string, string> = {
      'Content-Type': req.headers['content-type'] || 'application/json',
    };

    // Forward authorization header
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    // Forward other important headers
    if (req.headers['user-agent']) {
      headers['User-Agent'] = req.headers['user-agent'];
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    // Add body for POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        // For file uploads, we need to handle this differently
        // In a real implementation, you might use a streaming approach
        fetchOptions.body = JSON.stringify(req.body);
      } else {
        fetchOptions.body = JSON.stringify(req.body);
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();

    // Forward response headers
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    res.status(response.status);
    
    // Try to parse as JSON, fallback to text
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch {
      res.send(data);
    }

  } catch (error) {
    logger.error(`Proxy error for ${serviceName}:`, error);
    throw createError(`Failed to proxy request to ${serviceName}`, 502);
  }
};

// Auth service routes
router.use('/auth/*', asyncHandler(async (req: Request, res: Response) => {
  await proxyRequest(req, res, 'auth', '/api/auth');
}));

// Profile service routes
router.use('/profile/*', asyncHandler(async (req: Request, res: Response) => {
  await proxyRequest(req, res, 'profile', '/api/profile');
}));

// Document service routes
router.use('/documents/*', asyncHandler(async (req: Request, res: Response) => {
  await proxyRequest(req, res, 'document', '/api/documents');
}));

// Health check for all services
router.get('/health/all', asyncHandler(async (req: Request, res: Response) => {
  const servicesHealth = await ServiceDiscovery.getAllServicesHealth();
  const allHealthy = Object.values(servicesHealth).every(status => status);
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    services: servicesHealth,
    timestamp: new Date().toISOString()
  });
}));

// Service discovery endpoint
router.get('/services', asyncHandler(async (req: Request, res: Response) => {
  const servicesHealth = await ServiceDiscovery.getAllServicesHealth();
  
  res.json({
    success: true,
    data: {
      gateway: {
        status: 'healthy',
        version: '1.0.0'
      },
      services: servicesHealth
    }
  });
}));

export default router;

