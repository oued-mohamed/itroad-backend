// services/api-gateway/src/middleware/cors.ts
import cors from 'cors';
import { config } from '../config/environment';

export const corsMiddleware = cors({
  origin: function (origin, callback) {
    console.log('🔍 CORS Debug - Incoming origin:', origin);
    console.log('🔍 CORS Debug - Config CORS_ORIGIN:', config.CORS_ORIGIN);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS: No origin - allowing');
      return callback(null, true);
    }

    // Handle both string and array for CORS_ORIGIN
    const allowedOrigins = Array.isArray(config.CORS_ORIGIN) 
      ? config.CORS_ORIGIN 
      : config.CORS_ORIGIN.split(',').map(o => o.trim());

    // Add common development origins
    const developmentOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    ];

    const allAllowedOrigins = [...allowedOrigins, ...developmentOrigins];
    console.log('🔍 CORS Debug - All allowed origins:', allAllowedOrigins);

    // Check if origin is in allowed list
    if (allAllowedOrigins.includes(origin)) {
      console.log('✅ CORS: Origin allowed');
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin blocked:', origin);
      // For development, allow anyway but log the issue
      if (config.NODE_ENV === 'development') {
        console.log('🔧 CORS: Development mode - allowing anyway');
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  // These are crucial for proper preflight handling
  preflightContinue: false,
  optionsSuccessStatus: 204
});