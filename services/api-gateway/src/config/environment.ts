// services/api-gateway/src/config/environment.ts (Complete version)
export const config = {
  PORT: parseInt(process.env['PORT'] || '3000'),
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  JWT_SECRET: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-here-make-it-long-and-random',
  
  // Service URLs
  AUTH_SERVICE_URL: process.env['AUTH_SERVICE_URL'] || 'http://localhost:3001',
  PROFILE_SERVICE_URL: process.env['PROFILE_SERVICE_URL'] || 'http://localhost:3002',
  PROPERTY_SERVICE_URL: process.env['PROPERTY_SERVICE_URL'] || 'http://localhost:3003',
  DOCUMENT_SERVICE_URL: process.env['DOCUMENT_SERVICE_URL'] || 'http://localhost:3004',
  TRANSACTION_SERVICE_URL: process.env['TRANSACTION_SERVICE_URL'] || 'http://localhost:3005',
  
  // Rate limiting
  RATE_LIMIT_WINDOW: parseInt(process.env['RATE_LIMIT_WINDOW'] || '900000'), // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env['RATE_LIMIT_MAX'] || '100'), // 100 requests per window
  
  // CORS
  CORS_ORIGIN: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
  
  // Request timeout
  REQUEST_TIMEOUT: parseInt(process.env['REQUEST_TIMEOUT'] || '30000'), // 30 seconds
};

