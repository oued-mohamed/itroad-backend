// shared/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../types/common';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: ValidationError[];

  constructor(message: string, statusCode: number = 500, errors?: ValidationError[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (
  message: string, 
  statusCode: number = 500, 
  errors?: ValidationError[]
): AppError => {
  return new AppError(message, statusCode, errors);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: ValidationError[] = [];

  // Handle AppError (custom errors)
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errors = error.errors || [];
  }
  // Handle Validation Errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    // Handle Mongoose validation errors if using MongoDB
    if ((error as any).errors) {
      errors = Object.values((error as any).errors).map((err: any) => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
    }
  }
  // Handle Database Errors
  else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }
  else if (error.message.includes('duplicate key value')) {
    statusCode = 409;
    message = 'Resource already exists';
    const match = error.message.match(/Key \((.+)\)=\((.+)\)/);
    if (match) {
      errors = [{
        field: match[1],
        message: `${match[1]} '${match[2]}' already exists`,
        value: match[2]
      }];
    }
  }
  else if (error.message.includes('foreign key constraint')) {
    statusCode = 400;
    message = 'Invalid reference to related resource';
  }
  // Handle JWT Errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }
  // Handle Multer Errors (File Upload)
  else if (error.name === 'MulterError') {
    statusCode = 400;
    if ((error as any).code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds the maximum allowed limit';
    } else if ((error as any).code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded';
    } else if ((error as any).code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    } else {
      message = 'File upload error';
    }
  }
  // Handle Rate Limiting Errors
  else if (error.message.includes('Too many requests')) {
    statusCode = 429;
    message = 'Too many requests, please try again later';
  }

  // Log the error (don't log client errors)
  if (statusCode >= 500) {
    console.error('Server Error:', {
      message: error.message,
      stack: error.stack,
      statusCode,
      path: req.path,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      userId: (req as any).user?.userId,
      timestamp: new Date().toISOString()
    });
  } else {
    console.warn('Client Error:', {
      message: error.message,
      statusCode,
      path: req.path,
      method: req.method,
      userId: (req as any).user?.userId,
      timestamp: new Date().toISOString()
    });
  }

  const response: any = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors.length > 0) {
    response.errors = errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.error = error.message;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response) => {
  const message = `Route ${req.originalUrl} not found`;
  
  console.warn('Route not found:', {
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(404).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

// Helper function to handle async route handlers
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// Helper function for input validation
export const validateRequired = (fields: string[], data: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  fields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors.push({
        field,
        message: `${field} is required`,
        value: data[field]
      });
    }
  });
  
  return errors;
};

// Helper function for type validation
export const validateTypes = (validations: { field: string; type: string; value: any }[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  validations.forEach(({ field, type, value }) => {
    if (value !== undefined && value !== null) {
      switch (type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push({
              field,
              message: `${field} must be a string`,
              value
            });
          }
          break;
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push({
              field,
              message: `${field} must be a valid number`,
              value
            });
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push({
              field,
              message: `${field} must be a boolean`,
              value
            });
          }
          break;
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (typeof value !== 'string' || !emailRegex.test(value)) {
            errors.push({
              field,
              message: `${field} must be a valid email address`,
              value
            });
          }
          break;
        case 'uuid':
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (typeof value !== 'string' || !uuidRegex.test(value)) {
            errors.push({
              field,
              message: `${field} must be a valid UUID`,
              value
            });
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            errors.push({
              field,
              message: `${field} must be an array`,
              value
            });
          }
          break;
      }
    }
  });
  
  return errors;
};

export default errorHandler;