// services/profile-service/src/routes/profile.ts
import { Router } from 'express';
import { ProfileController } from '../controllers/profileController';
import { HealthController } from '../controllers/healthController';
import { authenticateToken } from '../middleware/auth';
import { validateProfileUpdate } from '../middleware/validation';
import { uploadAvatar } from '../middleware/upload';

const router = Router();

// Health check
router.get('/health', HealthController.check);

// Profile routes (all require authentication)
router.get('/', authenticateToken, ProfileController.getProfile);
router.put('/', authenticateToken, validateProfileUpdate, ProfileController.updateProfile);
router.delete('/', authenticateToken, ProfileController.deleteProfile);
router.post('/avatar', authenticateToken, uploadAvatar.single('avatar'), ProfileController.uploadAvatar);

export default router;

