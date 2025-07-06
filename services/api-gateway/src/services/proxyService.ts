// services/api-gateway/src/services/proxyService.ts
import { Request, Response } from 'express';
import { ServiceDiscovery } from '../config/services';
import { logger } from '../utils/logger';

export interface ProxyOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class ProxyService {
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private static readonly DEFAULT_RETRIES = 2;
  private static readonly DEFAULT_RETRY_DELAY = 1000; // 1 second

  static async proxyRequest(
    req: Request, 
    res: Response, 
    serviceName: string, 
    basePath: string = '',
    options: ProxyOptions = {}
  ): Promise<void> {
    const { 
      timeout = this.DEFAULT_TIMEOUT,
      retries = this.DEFAULT_RETRIES,
      retryDelay = this.DEFAULT_RETRY_DELAY
    } = options;

    const serviceUrl = ServiceDiscovery.getServiceUrl(serviceName);
    
    if (!serviceUrl) {
      logger.error(`Service ${serviceName} not found`);
      res.status(404).json({
        success: false,
        error: `Service ${serviceName} not found`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check service health first
    const isHealthy = await ServiceDiscovery.checkServiceHealth(serviceName);
    if (!isHealthy) {
      logger.error(`Service ${serviceName} is unhealthy`);
      res.status(503).json({
        success: false,
        error: `Service ${serviceName} is unavailable`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const targetUrl = `${serviceUrl}${basePath}${req.url}`;
    
    logger.info(`Proxying request: ${req.method} ${req.originalUrl} -> ${targetUrl}`);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await this.makeProxyRequest(req, res, targetUrl, timeout);
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < retries) {
          logger.warn(`Proxy attempt ${attempt + 1} failed, retrying in ${retryDelay}ms`, {
            error: lastError.message,
            targetUrl
          });
          await this.delay(retryDelay);
        }
      }
    }

    // All retries failed
    logger.error(`All proxy attempts failed for ${targetUrl}`, {
      error: lastError?.message,
      attempts: retries + 1
    });

    if (!res.headersSent) {
      res.status(502).json({
        success: false,
        error: `Failed to proxy request to ${serviceName}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  private static async makeProxyRequest(
    req: Request,
    res: Response,
    targetUrl: string,
    timeout: number
  ): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': req.headers['content-type'] || 'application/json',
    };

    // Forward important headers
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    if (req.headers['user-agent']) {
      headers['User-Agent'] = req.headers['user-agent'];
    }
    if (req.headers['x-forwarded-for']) {
      headers['X-Forwarded-For'] = req.headers['x-forwarded-for'] as string;
    } else {
      headers['X-Forwarded-For'] = req.ip || '';
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
      signal: AbortSignal.timeout(timeout)
    };

    // Add body for POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        // For file uploads, we need special handling
        // In a production environment, you might want to stream the request
        fetchOptions.body = JSON.stringify(req.body);
      } else {
        fetchOptions.body = JSON.stringify(req.body);
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    
    // Forward response headers (exclude hop-by-hop headers)
    const excludeHeaders = ['content-encoding', 'transfer-encoding', 'connection', 'keep-alive'];
    response.headers.forEach((value, key) => {
      if (!excludeHeaders.includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    res.status(response.status);
    
    // Handle different content types
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else if (contentType?.includes('text/')) {
      const text = await response.text();
      res.send(text);
    } else {
      // For binary data, stream it
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

