export interface JwtPayload {
  adherantId: string;
  email: string;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    adherant: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
    accessToken: string;
    refreshToken: string;
  };
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
