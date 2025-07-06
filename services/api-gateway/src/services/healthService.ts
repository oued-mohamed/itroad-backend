// services/api-gateway/src/services/healthService.ts
import { ServiceDiscovery } from '../config/services';

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  lastChecked: string;
  error?: string;
}

export interface OverallHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealth[];
  timestamp: string;
  uptime: number;
}

export class HealthService {
  private static healthCache = new Map<string, ServiceHealth>();
  private static readonly CACHE_TTL = 30000; // 30 seconds

  static async checkAllServices(): Promise<OverallHealth> {
    const serviceNames = ['auth', 'profile', 'document'];
    const healthChecks = await Promise.allSettled(
      serviceNames.map(name => this.checkSingleService(name))
    );

    const services: ServiceHealth[] = healthChecks.map((result, index) => {
      const serviceName: string = serviceNames[index] ?? 'unknown';
      
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          name: serviceName,
          status: 'unhealthy' as const,
          lastChecked: new Date().toISOString(),
          error: result.reason?.message || 'Health check failed'
        } as ServiceHealth;
      }
    });

    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const totalCount = services.length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalCount) {
      overallStatus = 'healthy';
    } else if (healthyCount > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    return {
      status: overallStatus,
      services,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }

  private static async checkSingleService(serviceName: string): Promise<ServiceHealth> {
    const cached = this.healthCache.get(serviceName);
    const now = Date.now();

    // Return cached result if still valid
    if (cached && (now - new Date(cached.lastChecked).getTime()) < this.CACHE_TTL) {
      return cached;
    }

    const startTime = Date.now();
    
    try {
      const isHealthy = await ServiceDiscovery.checkServiceHealth(serviceName);
      const responseTime = Date.now() - startTime;
      
      const health: ServiceHealth = {
        name: serviceName,
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        lastChecked: new Date().toISOString()
      };

      this.healthCache.set(serviceName, health);
      return health;
    } catch (error) {
      const health: ServiceHealth = {
        name: serviceName,
        status: 'unhealthy',
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.healthCache.set(serviceName, health);
      return health;
    }
  }

  static async getServiceHealth(serviceName: string): Promise<ServiceHealth> {
    return this.checkSingleService(serviceName);
  }

  static clearCache(): void {
    this.healthCache.clear();
  }
}

