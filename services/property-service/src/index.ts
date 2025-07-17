// services/property-service/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import propertiesRouter from '../src/routes/properties';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3006'
  ],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'property-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: PORT
  });
});

// Use routes
app.use('/api', propertiesRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    availableRoutes: [
      'GET /health',
      'GET /api/clients',
      'POST /api/clients',
      'GET /api/clients/stats',
      'GET /api/properties',
      'POST /api/properties'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🏠 Property Service running on port ${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`👥 Clients API: http://localhost:${PORT}/api/clients`);
  console.log(`🏢 Properties API: http://localhost:${PORT}/api/properties`);
});

export default app;