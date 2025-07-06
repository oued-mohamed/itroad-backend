// services/auth-service/src/services/authService.ts
import { AdherantModel, CreateAdherantInput } from '../models/Adherant';
import { RefreshTokenModel } from '../models/RefreshToken';
import { hashPassword, comparePassword, validatePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyToken, JwtPayload } from '../utils/jwt';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface LoginData {
  adherant: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  static async register(input: CreateAdherantInput): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await AdherantModel.findByEmail(input.email);
      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }

      // Validate password
      const passwordValidation = validatePassword(input.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.errors.join(', ')
        };
      }

      // Hash password
      const hashedPassword = await hashPassword(input.password);

      // Create user
      const adherant = await AdherantModel.create({
        ...input,
        password: hashedPassword
      });

      // Generate tokens
      const payload: JwtPayload = {
        adherantId: adherant.id,
        email: adherant.email,
        firstName: adherant.firstName,
        lastName: adherant.lastName
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Store refresh token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await RefreshTokenModel.create(refreshToken, adherant.id, expiresAt);

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          adherant: {
            id: adherant.id,
            email: adherant.email,
            firstName: adherant.firstName,
            lastName: adherant.lastName
          },
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      logger.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed'
      };
    }
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Find user
      const adherant = await AdherantModel.findByEmail(email);
      if (!adherant) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Check if account is active
      if (!adherant.isActive) {
        return {
          success: false,
          message: 'Account is deactivated'
        };
      }

      // Verify password
      const isValidPassword = await comparePassword(password, adherant.password);
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Generate tokens
      const payload: JwtPayload = {
        adherantId: adherant.id,
        email: adherant.email,
        firstName: adherant.firstName,
        lastName: adherant.lastName
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Store refresh token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await RefreshTokenModel.create(refreshToken, adherant.id, expiresAt);

      // Update last login
      await AdherantModel.updateLastLogin(adherant.id);

      return {
        success: true,
        message: 'Login successful',
        data: {
          adherant: {
            id: adherant.id,
            email: adherant.email,
            firstName: adherant.firstName,
            lastName: adherant.lastName
          },
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      logger.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed'
      };
    }
  }

  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const payload = verifyToken(refreshToken);
      
      // Check if refresh token exists in database
      const storedToken = await RefreshTokenModel.findByToken(refreshToken);
      if (!storedToken) {
        return {
          success: false,
          message: 'Invalid refresh token'
        };
      }

      // Get user details
      const adherant = await AdherantModel.findById(payload.adherantId);
      if (!adherant || !adherant.isActive) {
        return {
          success: false,
          message: 'User not found or inactive'
        };
      }

      // Generate new tokens
      const newPayload: JwtPayload = {
        adherantId: adherant.id,
        email: adherant.email,
        firstName: adherant.firstName,
        lastName: adherant.lastName
      };

      const newAccessToken = generateAccessToken(newPayload);
      const newRefreshToken = generateRefreshToken(newPayload);

      // Delete old refresh token and create new one
      await RefreshTokenModel.deleteByToken(refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await RefreshTokenModel.create(newRefreshToken, adherant.id, expiresAt);

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      return {
        success: false,
        message: 'Invalid refresh token'
      };
    }
  }

  static async logout(refreshToken: string): Promise<void> {
    try {
      if (refreshToken) {
        await RefreshTokenModel.deleteByToken(refreshToken);
      }
    } catch (error) {
      logger.error('Logout error:', error);
    }
  }

  static async getUserProfile(token: string): Promise<AuthResponse> {
    try {
      const payload = verifyToken(token);
      const adherant = await AdherantModel.findById(payload.adherantId);
      
      if (!adherant || !adherant.isActive) {
        return {
          success: false,
          message: 'User not found or inactive'
        };
      }

      return {
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          id: adherant.id,
          email: adherant.email,
          firstName: adherant.firstName,
          lastName: adherant.lastName,
          isActive: adherant.isActive,
          createdAt: adherant.createdAt
        }
      };
    } catch (error) {
      logger.error('Get user profile error:', error);
      return {
        success: false,
        message: 'Invalid token'
      };
    }
  }
}