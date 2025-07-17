// services/api-gateway/src/routes/gateway.ts
import { Router, Request, Response } from 'express';
import { ServiceDiscovery } from '../config/services';
import { asyncHandler, createError } from '../middleware/errorHandler';
import logger from '../config/logger';

const router = Router();

// Proxy utility function
const proxyRequest = async (req: Request, res: Response, serviceName: string, basePath: string = '') => {
  const serviceUrl = ServiceDiscovery.getServiceUrl(serviceName);
  
  if (!serviceUrl) {
    throw createError(`Service ${serviceName} not found`, 404);
  }

  // Check service health
  const isHealthy = await ServiceDiscovery.checkHealth(serviceName); // Fixed method name
  if (!isHealthy) {
    throw createError(`Service ${serviceName} is unavailable`, 503);
  }

  // Build target URL - remove the first part of the path that was matched by the router
  const originalPath = req.originalUrl;
  let targetPath = req.url; // This is the remaining path after router matching
  
  // If we're handling /api/v1/auth/register, we want to send /api/auth/register to the service
  if (originalPath.includes('/api/v1/')) {
    targetPath = originalPath.replace('/api/v1/', '/api/');
  } else if (originalPath.includes('/api/')) {
    targetPath = originalPath.replace('/api/', '/api/');
  }
  
  const targetUrl = `${serviceUrl}${targetPath}`;
  
  logger.info(`🔄 Proxying: ${req.method} ${originalPath} → ${targetUrl}`);

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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

    // Forward X-Forwarded headers
    if (req.headers['x-forwarded-for']) {
      headers['X-Forwarded-For'] = req.headers['x-forwarded-for'] as string;
    }

    // Add original IP
    headers['X-Original-IP'] = req.ip || 'unknown';

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
      signal: controller.signal, // Add timeout signal
    };

    // Add body for POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeoutId);

    const data = await response.text();

    // Forward response headers (excluding problematic ones)
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!['content-encoding', 'transfer-encoding', 'connection', 'upgrade'].includes(lowerKey)) {
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
    logger.error(`❌ Proxy error for ${serviceName}:`, error);
    
    // Handle specific error types
    if (error instanceof Error && error.name === 'AbortError') {
      throw createError(`Request to ${serviceName} timed out`, 504);
    }
    
    throw createError(`Failed to proxy request to ${serviceName}`, 502);
  }
};

// Auth service routes - handle /auth/* and forward to auth service
router.use('/auth', asyncHandler(async (req: Request, res: Response) => {
  await proxyRequest(req, res, 'auth');
}));

// Profile service routes - handle /profile/* and forward to profile service  
router.use('/profile', asyncHandler(async (req: Request, res: Response) => {
  await proxyRequest(req, res, 'profile');
}));

// Property service routes - handle /properties/* and forward to property service
router.use('/properties', asyncHandler(async (req: Request, res: Response) => {
  await proxyRequest(req, res, 'property');
}));

// Document service routes - handle /documents/* and forward to document service
router.use('/documents', asyncHandler(async (req: Request, res: Response) => {
  await proxyRequest(req, res, 'document');
}));

// Transaction service routes - handle /transactions/* and forward to transaction service
router.use('/transactions', asyncHandler(async (req: Request, res: Response) => {
  await proxyRequest(req, res, 'transaction');
}));

// Health check for all services
router.get('/health/all', asyncHandler(async (req: Request, res: Response) => {
  const servicesHealth = await ServiceDiscovery.checkAllServices(); // Fixed method name
  const allHealthy = Object.values(servicesHealth).every(status => status);
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    services: servicesHealth,
    timestamp: new Date().toISOString(),
    gateway: {
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    }
  });
}));

// Individual service health check
router.get('/health/:serviceName', asyncHandler(async (req: Request, res: Response) => {
  const { serviceName } = req.params;
  
  // Validate serviceName exists
  if (!serviceName) {
    return res.status(400).json({
      success: false,
      message: 'Service name is required',
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    const isHealthy = await ServiceDiscovery.checkHealth(serviceName);
    
    res.status(isHealthy ? 200 : 503).json({
      service: serviceName,
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(404).json({
      success: false,
      message: `Service ${serviceName} not found: ${errorMessage}`,
      timestamp: new Date().toISOString()
    });
  }
}));

// Service discovery endpoint
router.get('/services', asyncHandler(async (req: Request, res: Response) => {
  const servicesHealth = await ServiceDiscovery.checkAllServices(); // Fixed method name
  const servicesList = ServiceDiscovery.getAllServices();
  
  res.json({
    success: true,
    data: {
      gateway: {
        status: 'healthy',
        version: '1.0.0',
        uptime: process.uptime(),
      },
      services: servicesList.map(service => ({
        name: service.name,
        url: service.url,
        healthy: servicesHealth[service.name.replace('-service', '')] || false,
        timeout: service.timeout
      }))
    },
    timestamp: new Date().toISOString()
  });
}));

// Clear health cache endpoint (useful for debugging)
router.post('/health/cache/clear', asyncHandler(async (req: Request, res: Response) => {
  ServiceDiscovery.clearHealthCache();
  
  res.json({
    success: true,
    message: 'Health cache cleared',
    timestamp: new Date().toISOString()
  });
}));

// Get health cache status
router.get('/health/cache', asyncHandler(async (req: Request, res: Response) => {
  const cacheStatus = ServiceDiscovery.getHealthCacheStatus();
  
  res.json({
    success: true,
    data: cacheStatus,
    timestamp: new Date().toISOString()
  });
}));

// Gateway info endpoint
router.get('/info', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      name: 'API Gateway',
      version: '1.0.0',
      environment: process.env['NODE_ENV'] || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    }
  });
}));

export default router;