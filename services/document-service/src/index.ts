// services/document-service/src/index.ts
import express from 'express';
import compression from 'compression';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { config } from './config/environment';
import documentRoutes from './routes/documents';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth'; // ✅ Fixed import name
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();

// Basic middleware for internal service
app.use(compression()); // Keep for performance

// Body parsing middleware - essential for document service
app.use(express.json({ limit: '10mb' })); // For document metadata
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy (since we're behind API Gateway)
app.set('trust proxy', 1);

// Service-specific middleware
app.use('/api/documents', authenticateToken); // ✅ Fixed middleware name

// Health check endpoint (no auth needed)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'document-service',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/documents', documentRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    service: 'document-service'
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    const PORT = config.PORT || 3002;
    app.listen(PORT, () => {
      logger.info(`📄 Document Service running on port ${PORT}`);
      logger.info(`📊 Environment: ${config.NODE_ENV}`);
      logger.info(`🗄️  Database: Connected`);
      logger.info(`🏥 Health: http://localhost:${PORT}/health`);
      logger.info(`📚 API: http://localhost:${PORT}/api/documents`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handlers
const gracefulShutdown = () => {
  logger.info('🔄 Shutting down gracefully...');
  // Add cleanup logic here if needed (close DB connections, etc.)
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Error handlers
process.on('unhandledRejection', (err: Error) => {
  logger.error('💥 Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  logger.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

startServer();