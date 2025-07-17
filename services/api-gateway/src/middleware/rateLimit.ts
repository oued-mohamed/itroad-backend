// services/api-gateway/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import { config } from '../config/environment';

export const rateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW, 
  max: config.RATE_LIMIT_MAX,         
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later'
    });
  }
});