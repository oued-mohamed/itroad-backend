// services/transaction-service/src/index.ts
import 'tsconfig-paths/register';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/environment';
import { connectDB, closeDB } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Basic transaction routes (until you create the routes file)
app.get('/api/transactions', (req, res) => {
  res.json({
    success: true,
    message: 'Transaction service is running',
    data: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0
    }
  });
});

app.post('/api/transactions', (req, res) => {
  res.json({
    success: true,
    message: 'Transaction creation endpoint ready',
    data: { 
      id: 'txn-' + Date.now(), 
      status: 'pending',
      ...req.body 
    }
  });
});

app.get('/api/transactions/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      propertyId: 'prop-123',
      type: 'sale',
      status: 'pending',
      price: 350000,
      currency: 'USD',
      createdAt: new Date().toISOString()
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'transaction-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.NODE_ENV || 'development',
    port: config.PORT
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start listening
    const server = app.listen(config.PORT, () => {
      logger.info(`Transaction Service running on port ${config.PORT}`, {
        environment: config.NODE_ENV,
        port: config.PORT,
        service: 'transaction-service'
      });
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('Received shutdown signal, closing server...');
      
      server.close(async () => {
        try {
          // Close database connection
          await closeDB();
          logger.info('Server and database connections closed successfully');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Forcefully shutting down server');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start Transaction Service:', error);
    process.exit(1);
  }
};

startServer();