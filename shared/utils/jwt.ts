import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { JwtPayload } from '../types/auth';

// Configuration par défaut
const DEFAULT_ISSUER = 'adherant-platform';
const DEFAULT_AUDIENCE = 'adherant-users';
const DEFAULT_EXPIRES_IN: StringValue = '1h' as StringValue;

interface TokenOptions {
  expiresIn?: number | StringValue;  // Use the exact types from ms library
  issuer?: string;
  audience?: string;
}

// Interface pour les erreurs personnalisées
export class JwtError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'JwtError';
  }
}

export const generateToken = (
  payload: JwtPayload,
  secret: string,
  options: TokenOptions = {}
): string => {
  if (!payload || !secret) {
    throw new JwtError('Payload and secret are required', 'MISSING_PARAMS');
  }

  const signOptions: SignOptions = {
    expiresIn: (options.expiresIn || DEFAULT_EXPIRES_IN) as number | StringValue,
    issuer: options.issuer || DEFAULT_ISSUER,
    audience: options.audience || DEFAULT_AUDIENCE,
    algorithm: 'HS256' // Explicitement spécifier l'algorithme
  };

  try {
    // Remove standard JWT claims from payload to avoid conflicts
    const { iat, exp, iss, aud, ...cleanPayload } = payload;
    return jwt.sign(cleanPayload, secret, signOptions);
  } catch (error) {
    throw new JwtError(
      `Token generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'GENERATION_FAILED'
    );
  }
};

export const verifyToken = (
  token: string, 
  secret: string,
  options: TokenOptions = {}
): JwtPayload => {
  if (!token || !secret) {
    throw new JwtError('Token and secret are required', 'MISSING_PARAMS');
  }

  const verifyOptions: VerifyOptions = {
    issuer: options.issuer || DEFAULT_ISSUER,
    audience: options.audience || DEFAULT_AUDIENCE,
    algorithms: ['HS256'] // Limiter aux algorithmes autorisés
  };

  try {
    const decoded = jwt.verify(token, secret, verifyOptions);
    
    if (typeof decoded === 'object' && decoded !== null && 'adherantId' in decoded) {
      return decoded as JwtPayload;
    }
    
    throw new JwtError('Invalid token payload structure', 'INVALID_PAYLOAD');
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new JwtError(`Invalid token: ${error.message}`, 'INVALID_TOKEN');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new JwtError('Token has expired', 'TOKEN_EXPIRED');
    }
    if (error instanceof jwt.NotBeforeError) {
      throw new JwtError('Token not active yet', 'TOKEN_NOT_ACTIVE');
    }
    if (error instanceof JwtError) {
      throw error; // Re-throw nos erreurs personnalisées
    }
    
    throw new JwtError(
      `Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'VERIFICATION_FAILED'
    );
  }
};

export const decodeToken = (token: string): JwtPayload | null => {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const decoded = jwt.decode(token, { complete: false });
    
    if (!decoded || typeof decoded === 'string') {
      return null;
    }
    
    // Vérifier que le payload a la structure attendue
    if (typeof decoded === 'object' && 'adherantId' in decoded) {
      return decoded as JwtPayload;
    }
    
    return null;
  } catch {
    return null;
  }
};

// Nouvelle fonction pour vérifier si un token est expiré sans le valider complètement
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
};

// Fonction pour extraire les informations du token sans validation
export const getTokenInfo = (token: string): {
  isValid: boolean;
  isExpired: boolean;
  payload: JwtPayload | null;
  expiresAt: Date | null;
} => {
  const payload = decodeToken(token);
  
  if (!payload) {
    return {
      isValid: false,
      isExpired: true,
      payload: null,
      expiresAt: null
    };
  }

  const isExpired = isTokenExpired(token);
  const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;

  return {
    isValid: true,
    isExpired,
    payload,
    expiresAt
  };
};

// Fonction utilitaire pour rafraîchir un token
export const refreshToken = (
  oldToken: string,
  secret: string,
  newSecret?: string,
  options: TokenOptions = {}
): string => {
  const payload = decodeToken(oldToken);
  
  if (!payload) {
    throw new JwtError('Cannot refresh invalid token', 'INVALID_TOKEN');
  }

  // Create a new payload with the original data but without JWT standard claims
  const newPayload: JwtPayload = {
    adherantId: payload.adherantId,
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName
  };
  
  return generateToken(
    newPayload,
    newSecret || secret,
    options
  );
};

// Export des constantes pour utilisation externe
export const JWT_CONSTANTS = {
  DEFAULT_ISSUER,
  DEFAULT_AUDIENCE,
  DEFAULT_EXPIRES_IN
} as const;