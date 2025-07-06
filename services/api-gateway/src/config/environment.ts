// services/api-gateway/src/config/environment.ts
export const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SERVICES: {
    AUTH: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    PROFILE: process.env.PROFILE_SERVICE_URL || 'http://localhost:3002',
    DOCUMENT: process.env.DOCUMENT_SERVICE_URL || 'http://localhost:3003'
  },
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  },
  CORS: {
    ORIGIN: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    CREDENTIALS: process.env.CORS_CREDENTIALS === 'true'
  }
};

