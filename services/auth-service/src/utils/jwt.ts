// services/auth-service/src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';

export interface JwtPayload {
  adherantId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
    issuer: 'auth-service',
    audience: 'adherant-platform'
  });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
    issuer: 'auth-service',
    audience: 'adherant-platform'
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.JWT_SECRET, {
    issuer: 'auth-service',
    audience: 'adherant-platform'
  }) as JwtPayload;
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};

