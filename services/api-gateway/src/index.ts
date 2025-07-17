// services/api-gateway/src/index.ts
import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { config } from './config/environment';
import { corsMiddleware } from './middleware/cors';
import { rateLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import gatewayRoutes from './routes/gateway';
import { logger } from './utils/logger';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS must be FIRST and handle all requests including OPTIONS
app.use(corsMiddleware);

// Explicitly handle OPTIONS preflight requests
app.options('*', corsMiddleware);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// Gateway routes - support both /api and /api/v1
app.use('/api/v1', gatewayRoutes);
app.use('/api', gatewayRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handling
app.use(errorHandler);

// Start server
const startServer = () => {
  app.listen(config.PORT, () => {
    logger.info(`API Gateway running on port ${config.PORT}`);
    
    // Fixed logging - show individual service URLs
    logger.info('Service endpoints:', {
      AUTH: config.AUTH_SERVICE_URL,
      PROFILE: config.PROFILE_SERVICE_URL,
      PROPERTY: config.PROPERTY_SERVICE_URL,
      DOCUMENT: config.DOCUMENT_SERVICE_URL,
      TRANSACTION: config.TRANSACTION_SERVICE_URL
    });
    
    logger.info('CORS origins:', config.CORS_ORIGIN);
    
    // Debug: Show environment variables
    console.log('🔧 Environment Debug:');
    console.log('AUTH_SERVICE_URL from env:', process.env['AUTH_SERVICE_URL']);
    console.log('AUTH_SERVICE_URL from config:', config.AUTH_SERVICE_URL);
    console.log('NODE_ENV:', config.NODE_ENV);
  });
};

startServer();