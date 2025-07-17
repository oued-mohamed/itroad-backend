// services/auth-service/src/controllers/userController.ts
import { Request, Response } from 'express';
import { UserModel } from '../models/user';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export class UserController {
  static getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.user!;

    const user = await UserModel.findById(userId);
    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  });

  static updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.user!;
    const { firstName, lastName } = req.body;

    const updates: any = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;

    const updatedUser = await UserModel.updateUser(userId, updates);
    if (!updatedUser) {
      throw createError('Failed to update profile', 400);
    }

    logger.info('User profile updated', { userId });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      }
    });
  });

  static getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { role } = req.user!;

    if (role !== 'admin') {
      throw createError('Access denied. Admin only.', 403);
    }

    const { role: filterRole, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let users;
    if (filterRole && typeof filterRole === 'string') {
      users = await UserModel.findByRole(filterRole, limitNum, offset);
    } else {
      // For now, get all by getting each role (you'd implement findAll in UserModel)
      users = await UserModel.findByRole('client', limitNum, offset);
    }

    res.json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: users.length
      }
    });
  });

  static getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { role } = req.user!;
    const { id } = req.params;

    if (role !== 'admin') {
      throw createError('Access denied. Admin only.', 403);
    }

    if (!id) {
      throw createError('User ID is required', 400);
    }

    const user = await UserModel.findById(id);
    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  });

  static deactivateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { role } = req.user!;
    const { id } = req.params;

    if (role !== 'admin') {
      throw createError('Access denied. Admin only.', 403);
    }

    if (!id) {
      throw createError('User ID is required', 400);
    }

    const deactivated = await UserModel.deactivateUser(id);
    if (!deactivated) {
      throw createError('User not found or already deactivated', 404);
    }

    logger.info('User deactivated', { userId: id, deactivatedBy: req.user!.userId });

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  });

  static changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.user!;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw createError('Current password and new password are required', 400);
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Verify current password
    const { comparePassword } = await import('../utils/password');
    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw createError('Current password is incorrect', 400);
    }

    // Validate new password
    const { validatePassword, hashPassword } = await import('../utils/password');
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw createError(passwordValidation.errors.join(', '), 400);
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(newPassword);
    await UserModel.updateUser(userId, { password: hashedPassword });

    logger.info('User password changed', { userId });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  });

  static getUserStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { role } = req.user!;

    if (role !== 'admin') {
      throw createError('Access denied. Admin only.', 403);
    }

    // Get user statistics
    const adminUsers = await UserModel.findByRole('admin', 100, 0);
    const agentUsers = await UserModel.findByRole('agent', 100, 0);
    const clientUsers = await UserModel.findByRole('client', 100, 0);

    const stats = {
      totalUsers: adminUsers.length + agentUsers.length + clientUsers.length,
      usersByRole: {
        admin: adminUsers.length,
        agent: agentUsers.length,
        client: clientUsers.length
      },
      recentRegistrations: {
        thisWeek: 0, // Would need to implement date filtering in UserModel
        thisMonth: 0,
        lastMonth: 0
      }
    };

    res.json({
      success: true,
      data: stats
    });
  });

  static updateUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { role } = req.user!;
    const { id } = req.params;
    const { newRole } = req.body;

    if (role !== 'admin') {
      throw createError('Access denied. Admin only.', 403);
    }

    if (!['admin', 'agent', 'client'].includes(newRole)) {
      throw createError('Invalid role. Must be admin, agent, or client', 400);
    }

    const updatedUser = await UserModel.updateUser(id, { role: newRole });
    if (!updatedUser) {
      throw createError('User not found or update failed', 404);
    }

    logger.info('User role updated', { userId: id, newRole, updatedBy: req.user!.userId });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      }
    });
  });

  static reactivateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { role } = req.user!;
    const { id } = req.params;

    if (role !== 'admin') {
      throw createError('Access denied. Admin only.', 403);
    }

    // Would need to implement reactivateUser in UserModel
    const query = `
      UPDATE users
      SET is_active = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    const { pool } = await import('../config/database');
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      throw createError('User not found', 404);
    }

    logger.info('User reactivated', { userId: id, reactivatedBy: req.user!.userId });

    res.json({
      success: true,
      message: 'User reactivated successfully'
    });
  });

  static deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { role, userId } = req.user!;
    const { id } = req.params;

    if (role !== 'admin') {
      throw createError('Access denied. Admin only.', 403);
    }

    if (userId === id) {
      throw createError('You cannot delete your own account', 400);
    }

    // Soft delete by deactivating
    const deactivated = await UserModel.deactivateUser(id);
    if (!deactivated) {
      throw createError('User not found or already deleted', 404);
    }

    logger.info('User deleted (deactivated)', { userId: id, deletedBy: userId });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  });
}

