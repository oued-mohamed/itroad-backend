// services/api-gateway/src/config/services.ts
import { config } from './environment';

export interface ServiceConfig {
  name: string;
  url: string;
  healthEndpoint: string;
  timeout: number;
}

export const services: Record<string, ServiceConfig> = {
  auth: {
    name: 'auth-service',
    url: config.AUTH_SERVICE_URL,
    healthEndpoint: '/api/auth/health',
    timeout: 5000
  },
  profile: {
    name: 'profile-service',
    url: config.PROFILE_SERVICE_URL,
    healthEndpoint: '/api/profile/health',
    timeout: 5000
  },
  property: {
    name: 'property-service',
    url: config.PROPERTY_SERVICE_URL,
    healthEndpoint: '/api/properties/health',
    timeout: 5000
  },
  document: {
    name: 'document-service',
    url: config.DOCUMENT_SERVICE_URL,
    healthEndpoint: '/api/documents/health',
    timeout: 10000 // Higher timeout for file operations
  },
  transaction: {
    name: 'transaction-service',
    url: config.TRANSACTION_SERVICE_URL,
    healthEndpoint: '/api/transactions/health',
    timeout: 5000
  }
};

export class ServiceDiscovery {
  private static healthCache = new Map<string, { status: boolean; lastCheck: number }>();
  private static readonly CACHE_TTL = 30000; // 30 seconds

  static async checkHealth(serviceName: string): Promise<boolean> {
    const service = services[serviceName];
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    // Check cache first
    const cached = this.healthCache.get(serviceName);
    if (cached && Date.now() - cached.lastCheck < this.CACHE_TTL) {
      return cached.status;
    }

    try {
      // Create AbortController for timeout functionality
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), service.timeout);

      const response = await fetch(`${service.url}${service.healthEndpoint}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);
      const isHealthy = response.ok;
      
      // Update cache
      this.healthCache.set(serviceName, {
        status: isHealthy,
        lastCheck: Date.now()
      });

      return isHealthy;
    } catch (error) {
      console.error(`Health check failed for ${serviceName}:`, error);
      
      // Update cache with failed status
      this.healthCache.set(serviceName, {
        status: false,
        lastCheck: Date.now()
      });

      return false;
    }
  }

  static async checkAllServices(): Promise<Record<string, boolean>> {
    const healthChecks = await Promise.allSettled(
      Object.keys(services).map(async (serviceName) => ({
        serviceName,
        healthy: await this.checkHealth(serviceName)
      }))
    );

    const results: Record<string, boolean> = {};
    
    healthChecks.forEach((result, index) => {
      const serviceNames = Object.keys(services);
      const serviceName = serviceNames[index];
      
      if (serviceName && result.status === 'fulfilled') {
        results[serviceName] = result.value.healthy;
      } else if (serviceName) {
        results[serviceName] = false;
      }
    });

    return results;
  }

  static getServiceUrl(serviceName: string): string {
    const service = services[serviceName];
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    return service.url;
  }

  static getAllServices(): ServiceConfig[] {
    return Object.values(services);
  }

  static getServiceNames(): string[] {
    return Object.keys(services);
  }

  static clearHealthCache(): void {
    this.healthCache.clear();
  }

  static getHealthCacheStatus(): Record<string, { status: boolean; lastCheck: number }> {
    const result: Record<string, { status: boolean; lastCheck: number }> = {};
    this.healthCache.forEach((value, key) => {
      result[key] = { ...value };
    });
    return result;
  }
}