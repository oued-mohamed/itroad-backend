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
    url: config.SERVICES.AUTH,
    healthEndpoint: '/api/auth/health',
    timeout: 5000
  },
  profile: {
    name: 'profile-service',
    url: config.SERVICES.PROFILE,
    healthEndpoint: '/api/profile/health',
    timeout: 5000
  },
  document: {
    name: 'document-service',
    url: config.SERVICES.DOCUMENT,
    healthEndpoint: '/api/documents/health',
    timeout: 10000 // Higher timeout for file operations
  }
};

export class ServiceDiscovery {
  private static healthCache = new Map<string, { status: boolean; lastCheck: number }>();
  private static readonly CACHE_TTL = 30000; // 30 seconds

  static async checkServiceHealth(serviceName: string): Promise<boolean> {
    const service = services[serviceName];
    if (!service) return false;

    const cached = this.healthCache.get(serviceName);
    const now = Date.now();

    // Return cached result if still valid
    if (cached && (now - cached.lastCheck) < this.CACHE_TTL) {
      return cached.status;
    }

    try {
      const response = await fetch(`${service.url}${service.healthEndpoint}`, {
        method: 'GET',
        timeout: service.timeout
      } as any);

      const isHealthy = response.ok;
      this.healthCache.set(serviceName, { status: isHealthy, lastCheck: now });
      return isHealthy;
    } catch (error) {
      this.healthCache.set(serviceName, { status: false, lastCheck: now });
      return false;
    }
  }

  static getServiceUrl(serviceName: string): string | null {
    const service = services[serviceName];
    return service ? service.url : null;
  }

  static async getAllServicesHealth(): Promise<Record<string, boolean>> {
    const healthChecks = Object.keys(services).map(async (serviceName) => {
      const isHealthy = await this.checkServiceHealth(serviceName);
      return { [serviceName]: isHealthy };
    });

    const results = await Promise.all(healthChecks);
    return results.reduce((acc, result) => ({ ...acc, ...result }), {});
  }
}

