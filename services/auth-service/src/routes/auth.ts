// services/auth-service/src/routes/auth.ts
import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { HealthController } from '../controllers/healthController';
import { validateRegistration, validateLogin, validateRefreshToken } from '../middleware/validation';
import { loginLimiter } from '../middleware/rateLimit';

const router = Router();

// Health check
router.get('/health', HealthController.check);

// Authentication routes
router.post('/register', validateRegistration, AuthController.register);
router.post('/login', loginLimiter, validateLogin, AuthController.login);
router.post('/refresh', validateRefreshToken, AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.get('/me', AuthController.me);

export default router;