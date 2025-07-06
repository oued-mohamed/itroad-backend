// services/profile-service/src/services/profileService.ts
import { ProfileModel, CreateProfileInput, UpdateProfileInput } from '../models/Profile';
import { FileHelper } from '../utils/fileHelper';
import { logger } from '../utils/logger';
import path from 'path';

export interface ProfileResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class ProfileService {
  static async getProfile(adherantId: string): Promise<ProfileResponse> {
    try {
      const profile = await ProfileModel.findByAdherantId(adherantId);
      
      if (!profile) {
        // Create default profile if it doesn't exist
        const defaultProfile = await ProfileModel.create({ adherantId });
        return {
          success: true,
          message: 'Profile retrieved successfully',
          data: defaultProfile
        };
      }

      return {
        success: true,
        message: 'Profile retrieved successfully',
        data: profile
      };
    } catch (error) {
      logger.error('Get profile error:', error);
      return {
        success: false,
        message: 'Failed to retrieve profile'
      };
    }
  }

  static async updateProfile(adherantId: string, updates: UpdateProfileInput, avatarFile?: Express.Multer.File): Promise<ProfileResponse> {
    try {
      let updateData = { ...updates };

      // Handle avatar upload
      if (avatarFile) {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3002';
        updateData.avatar = FileHelper.getFileUrl(avatarFile.filename, baseUrl);

        // Delete old avatar if exists
        const existingProfile = await ProfileModel.findByAdherantId(adherantId);
        if (existingProfile?.avatar) {
          const oldFilename = FileHelper.extractFilename(existingProfile.avatar);
          if (oldFilename) {
            const oldFilePath = path.join(process.cwd(), 'uploads/avatars', oldFilename);
            await FileHelper.deleteFile(oldFilePath);
          }
        }
      }

      const profile = await ProfileModel.update(adherantId, updateData);
      
      if (!profile) {
        return {
          success: false,
          message: 'Profile not found'
        };
      }

      return {
        success: true,
        message: 'Profile updated successfully',
        data: profile
      };
    } catch (error) {
      logger.error('Update profile error:', error);
      return {
        success: false,
        message: 'Failed to update profile'
      };
    }
  }

  static async deleteProfile(adherantId: string): Promise<ProfileResponse> {
    try {
      // Get profile to delete avatar file
      const profile = await ProfileModel.findByAdherantId(adherantId);
      if (profile?.avatar) {
        const filename = FileHelper.extractFilename(profile.avatar);
        if (filename) {
          const filePath = path.join(process.cwd(), 'uploads/avatars', filename);
          await FileHelper.deleteFile(filePath);
        }
      }

      await ProfileModel.delete(adherantId);

      return {
        success: true,
        message: 'Profile deleted successfully'
      };
    } catch (error) {
      logger.error('Delete profile error:', error);
      return {
        success: false,
        message: 'Failed to delete profile'
      };
    }
  }
}

