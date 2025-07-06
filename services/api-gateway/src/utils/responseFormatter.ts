// services/api-gateway/src/utils/responseFormatter.ts
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
  path?: string;
}

export const formatSuccessResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  ...(message !== undefined ? { message } : {}),
  data,
  timestamp: new Date().toISOString()
});

export const formatErrorResponse = (error: string, path?: string): ApiResponse => ({
  success: false,
  error,
  timestamp: new Date().toISOString(),
  ...(path !== undefined ? { path } : {})
});

