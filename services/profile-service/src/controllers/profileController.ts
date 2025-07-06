// services/profile-service/src/controllers/profileController.ts
import { Response } from 'express';
import { ProfileService } from '../services/profileService';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

export class ProfileController {
  static getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await ProfileService.getProfile(req.user!.adherantId);
    
    res.json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  });

  static updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await ProfileService.updateProfile(
      req.user!.adherantId,
      req.body,
      req.file
    );
    
    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  });

  static deleteProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await ProfileService.deleteProfile(req.user!.adherantId);
    
    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json({
      success: result.success,
      message: result.message
    });
  });

  static uploadAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No avatar file provided'
      });
    }

    const result = await ProfileService.updateProfile(
      req.user!.adherantId,
      {},
      req.file
    );
    
    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  });
}

