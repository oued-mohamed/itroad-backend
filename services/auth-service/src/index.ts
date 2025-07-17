// services/auth-service/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { config } from './config/environment';
import authRoutes from './routes/auth';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimit';
import { logger } from './utils/logger';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS middleware - Updated to allow frontend on port 3006
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3006',  // Added for your React app
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3006'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
// app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'auth-service',
    port: config.PORT,
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(config.PORT, () => {
      logger.info(`Auth service running on port ${config.PORT}`);
      logger.info(`CORS enabled for: localhost:3000, localhost:3006`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();