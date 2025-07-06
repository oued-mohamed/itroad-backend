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
app.use(corsMiddleware);
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

// Gateway routes
app.use('/api', gatewayRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handling
app.use(errorHandler);

// Start server
const startServer = () => {
  app.listen(config.PORT, () => {
    logger.info(`API Gateway running on port ${config.PORT}`);
    logger.info('Service endpoints:', config.SERVICES);
  });
};

startServer();

