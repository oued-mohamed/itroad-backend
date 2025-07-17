// services/api-gateway/src/middleware/cors.ts
import cors from 'cors';
import { config } from '../config/environment';

export const corsMiddleware = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Handle both string and array for CORS_ORIGIN
    const allowedOrigins = Array.isArray(config.CORS_ORIGIN) 
      ? config.CORS_ORIGIN 
      : config.CORS_ORIGIN.split(',').map(o => o.trim());

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true, // Since you had config.CORS.CREDENTIALS, assuming this should be true
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ]
});