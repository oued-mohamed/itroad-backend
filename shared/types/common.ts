export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
  timestamp?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
  pages?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationParams;
}
