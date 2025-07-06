// services/auth-service/src/controllers/authController.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName } = req.body;
    
    const result = await AuthService.register({
      email,
      password,
      firstName,
      lastName
    });
    
    if (!result.success) {
      throw createError(result.message, 400);
    }
    
    logger.info('User registered successfully', { email });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result.data
    });
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    const result = await AuthService.login(email, password);
    
    if (!result.success) {
      throw createError(result.message, 401);
    }
    
    logger.info('User logged in successfully', { email });
    
    res.json({
      success: true,
      message: 'Login successful',
      data: result.data
    });
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    const result = await AuthService.refreshToken(refreshToken);
    
    if (!result.success) {
      throw createError(result.message, 401);
    }
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result.data
    });
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    await AuthService.logout(refreshToken);
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  });

  static me = asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('No token provided', 401);
    }
    
    const token = authHeader.substring(7);
    const result = await AuthService.getUserProfile(token);
    
    if (!result.success) {
      throw createError(result.message, 401);
    }
    
    res.json({
      success: true,
      data: result.data
    });
  });
}

