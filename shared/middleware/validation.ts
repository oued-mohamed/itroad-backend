// shared/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, body, param, query } from 'express-validator';
import { createError } from './errorHandler';
import { ValidationError } from '../types/common';
// Handle validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors: ValidationError[] = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationErrors,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Common validation rules
export const commonValidations = {
  // ID validations
  uuidParam: (paramName: string = 'id') => 
    param(paramName)
      .isUUID()
      .withMessage(`${paramName} must be a valid UUID`),
  
  // Pagination validations
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  
  // Search validations
  search: [
    query('search')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Search term must be between 1 and 255 characters'),
    query('sortBy')
      .optional()
      .isAlpha()
      .withMessage('Sort field must contain only letters'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ],
  
  // Email validation
  email: (fieldName: string = 'email') =>
    body(fieldName)
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
  
  // Password validation
  password: (fieldName: string = 'password') =>
    body(fieldName)
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  // Name validation
  name: (fieldName: string) =>
    body(fieldName)
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage(`${fieldName} must be between 1 and 100 characters`)
      .matches(/^[a-zA-Z\s\-'\.]+$/)
      .withMessage(`${fieldName} must contain only letters, spaces, hyphens, apostrophes, and periods`),
  
  // Phone validation
  phone: (fieldName: string = 'phone') =>
    body(fieldName)
      .optional()
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number'),
  
  // URL validation
  url: (fieldName: string) =>
    body(fieldName)
      .optional()
      .isURL()
      .withMessage(`${fieldName} must be a valid URL`),
  
  // Date validation
  date: (fieldName: string) =>
    body(fieldName)
      .isISO8601()
      .withMessage(`${fieldName} must be a valid ISO 8601 date`),
  
  // Numeric validations
  positiveNumber: (fieldName: string) =>
    body(fieldName)
      .isFloat({ min: 0 })
      .withMessage(`${fieldName} must be a positive number`),
  
  positiveInteger: (fieldName: string) =>
    body(fieldName)
      .isInt({ min: 0 })
      .withMessage(`${fieldName} must be a positive integer`),
  
  // Array validation
  array: (fieldName: string, minLength = 0, maxLength = 100) =>
    body(fieldName)
      .isArray({ min: minLength, max: maxLength })
      .withMessage(`${fieldName} must be an array with ${minLength}-${maxLength} items`),
  
  // Boolean validation
  boolean: (fieldName: string) =>
    body(fieldName)
      .optional()
      .isBoolean()
      .withMessage(`${fieldName} must be a boolean`),
  
  // Currency validation
  currency: (fieldName: string = 'currency') =>
    body(fieldName)
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency must be a 3-letter code')
      .isAlpha()
      .withMessage('Currency must contain only letters')
      .toUpperCase(),
  
  // Coordinates validation
  latitude: (fieldName: string = 'latitude') =>
    body(fieldName)
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
  
  longitude: (fieldName: string = 'longitude') =>
    body(fieldName)
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180')
};

// User validation rules
export const userValidations = {
  register: [
    commonValidations.email(),
    commonValidations.password(),
    commonValidations.name('firstName'),
    commonValidations.name('lastName'),
    body('role')
      .optional()
      .isIn(['admin', 'agent', 'client'])
      .withMessage('Role must be admin, agent, or client')
  ],
  
  login: [
    commonValidations.email(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  
  updateProfile: [
    commonValidations.name('firstName').optional(),
    commonValidations.name('lastName').optional(),
    commonValidations.phone().optional()
  ],
  
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    commonValidations.password('newPassword')
  ]
};

// Property validation rules
export const propertyValidations = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Title is required and must be less than 255 characters'),
    body('description')
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Description is required and must be less than 2000 characters'),
    body('type')
      .isIn(['house', 'apartment', 'condo', 'townhouse', 'villa', 'studio', 'duplex', 'penthouse', 'commercial', 'office', 'retail', 'warehouse', 'land', 'other'])
      .withMessage('Invalid property type'),
    commonValidations.positiveNumber('price'),
    commonValidations.currency(),
    body('address').trim().isLength({ min: 1, max: 255 }).withMessage('Address is required'),
    body('city').trim().isLength({ min: 1, max: 100 }).withMessage('City is required'),
    body('state').trim().isLength({ min: 1, max: 100 }).withMessage('State is required'),
    body('country').trim().isLength({ min: 1, max: 100 }).withMessage('Country is required'),
    body('postalCode').trim().isLength({ min: 1, max: 20 }).withMessage('Postal code is required'),
    commonValidations.latitude(),
    commonValidations.longitude(),
    body('bedrooms').optional().isInt({ min: 0, max: 50 }).withMessage('Bedrooms must be 0-50'),
    body('bathrooms').optional().isFloat({ min: 0, max: 50 }).withMessage('Bathrooms must be 0-50'),
    commonValidations.positiveNumber('area'),
    body('areaUnit').optional().isIn(['sqft', 'sqm']).withMessage('Area unit must be sqft or sqm'),
    body('yearBuilt').optional().isInt({ min: 1800, max: new Date().getFullYear() + 2 }).withMessage('Invalid year built'),
    commonValidations.array('features', 0, 50),
    commonValidations.url('virtualTourUrl'),
    commonValidations.boolean('isFeatured')
  ],
  
  search: [
    ...commonValidations.pagination,
    ...commonValidations.search,
    query('type').optional().isIn(['house', 'apartment', 'condo', 'townhouse', 'villa', 'studio', 'duplex', 'penthouse', 'commercial', 'office', 'retail', 'warehouse', 'land', 'other']).withMessage('Invalid property type'),
    query('status').optional().isIn(['available', 'under_contract', 'sold', 'rented', 'off_market', 'pending', 'draft']).withMessage('Invalid property status'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be positive'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be positive'),
    query('minBedrooms').optional().isInt({ min: 0 }).withMessage('Min bedrooms must be positive'),
    query('maxBedrooms').optional().isInt({ min: 0 }).withMessage('Max bedrooms must be positive')
  ]
};

// Document validation rules
export const documentValidations = {
  upload: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Title is required and must be less than 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('category')
      .isIn(['identity', 'medical', 'education', 'employment', 'financial', 'legal', 'insurance', 'property', 'other'])
      .withMessage('Invalid document category'),
    commonValidations.array('tags', 0, 10),
    commonValidations.boolean('isPrivate'),
    commonValidations.date('expirationDate').optional()
  ]
};

// Transaction validation rules
export const transactionValidations = {
  create: [
    commonValidations.uuidParam('propertyId'),
    body('buyerId').isUUID().withMessage('Buyer ID must be a valid UUID'),
    body('sellerId').isUUID().withMessage('Seller ID must be a valid UUID'),
    body('type').isIn(['sale', 'rent', 'lease']).withMessage('Invalid transaction type'),
    commonValidations.positiveNumber('price'),
    commonValidations.currency(),
    body('commissionRate').isFloat({ min: 0, max: 100 }).withMessage('Commission rate must be 0-100%'),
    commonValidations.date('closingDate'),
    commonValidations.date('contractDate'),
    commonValidations.date('inspectionDate').optional()
  ]
};

// Custom validation functions
export const customValidations = {
  // Check if passwords match
  passwordConfirmation: (passwordField: string = 'password', confirmField: string = 'confirmPassword') =>
    body(confirmField)
      .custom((value, { req }) => {
        if (value !== req.body[passwordField]) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      }),
  
  // Check if end date is after start date
  dateRange: (startField: string, endField: string) =>
    body(endField)
      .custom((endDate, { req }) => {
        const startDate = req.body[startField];
        if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
          throw new Error(`${endField} must be after ${startField}`);
        }
        return true;
      }),
  
  // Check if max value is greater than min value
  numericRange: (minField: string, maxField: string) =>
    body(maxField)
      .custom((maxValue, { req }) => {
        const minValue = req.body[minField];
        if (minValue !== undefined && maxValue !== undefined && parseFloat(maxValue) <= parseFloat(minValue)) {
          throw new Error(`${maxField} must be greater than ${minField}`);
        }
        return true;
      }),
  
  // Check if array contains unique values
  uniqueArray: (fieldName: string) =>
    body(fieldName)
      .custom((arr) => {
        if (Array.isArray(arr)) {
          const uniqueValues = new Set(arr);
          if (uniqueValues.size !== arr.length) {
            throw new Error(`${fieldName} must contain unique values`);
          }
        }
        return true;
      })
};

// Sanitization helpers
export const sanitizers = {
  trimAndLowercase: (fieldName: string) =>
    body(fieldName).trim().toLowerCase(),
  
  trimAndCapitalize: (fieldName: string) =>
    body(fieldName).trim().customSanitizer((value: string) => {
      if (typeof value === 'string') {
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      }
      return value;
    }),
  
  removeSpecialChars: (fieldName: string) =>
    body(fieldName).trim().customSanitizer((value: string) => {
      if (typeof value === 'string') {
        return value.replace(/[^a-zA-Z0-9\s]/g, '');
      }
      return value;
    }),
  
  normalizePhoneNumber: (fieldName: string = 'phone') =>
    body(fieldName).customSanitizer((value: string) => {
      if (typeof value === 'string') {
        // Remove all non-numeric characters except +
        return value.replace(/[^\d+]/g, '');
      }
      return value;
    }),
  
  parseNumeric: (fieldName: string) =>
    body(fieldName).customSanitizer((value: any) => {
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? value : parsed;
      }
      return value;
    }),
  
  parseBoolean: (fieldName: string) =>
    body(fieldName).customSanitizer((value: any) => {
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
          return true;
        }
        if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
          return false;
        }
      }
      return value;
    }),
  
  parseArray: (fieldName: string, delimiter: string = ',') =>
    body(fieldName).customSanitizer((value: any) => {
      if (typeof value === 'string') {
        return value.split(delimiter).map((item: string) => item.trim()).filter(Boolean);
      }
      return value;
    }),
  
  stripHtml: (fieldName: string) =>
    body(fieldName).customSanitizer((value: string) => {
      if (typeof value === 'string') {
        return value.replace(/<[^>]*>/g, '');
      }
      return value;
    }),
  
  normalizeEmail: (fieldName: string = 'email') =>
    body(fieldName).trim().toLowerCase().normalizeEmail(),
  
  formatCurrency: (fieldName: string) =>
    body(fieldName).customSanitizer((value: any) => {
      if (typeof value === 'string') {
        // Remove currency symbols and formatting
        const cleaned = value.replace(/[$,\s]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? value : parsed;
      }
      return value;
    }),
  
  normalizePostalCode: (fieldName: string = 'postalCode') =>
    body(fieldName).trim().toUpperCase().customSanitizer((value: string) => {
      if (typeof value === 'string') {
        // Remove spaces and special characters, keep only alphanumeric
        return value.replace(/[^A-Z0-9]/g, '');
      }
      return value;
    })
};

// Validation middleware factory
export const createValidationMiddleware = (validations: ValidationChain[]) => {
  return [
    ...validations,
    handleValidationErrors
  ];
};

// Conditional validation
export const conditionalValidation = (condition: (req: Request) => boolean, validation: ValidationChain) => {
  return validation.if(condition);
};

// Role-based validation
export const roleBasedValidation = (allowedRoles: string[], validation: ValidationChain) => {
  return validation.if((value: any, { req }: any) => {
    const userRole = req.user?.role;
    return allowedRoles.includes(userRole);
  });
};

// Field dependency validation
export const dependentField = (dependsOn: string, validation: ValidationChain) => {
  return validation.if((value: any, { req }: any) => {
    return req.body[dependsOn] !== undefined && req.body[dependsOn] !== null && req.body[dependsOn] !== '';
  });
};

// Validation groups for complex forms
export const validationGroups = {
  userRegistration: createValidationMiddleware([
    ...userValidations.register,
    customValidations.passwordConfirmation()
  ]),
  
  userLogin: createValidationMiddleware(userValidations.login),
  
  propertyCreation: createValidationMiddleware([
    ...propertyValidations.create,
    customValidations.numericRange('minPrice', 'maxPrice'),
    customValidations.dateRange('contractDate', 'closingDate')
  ]),
  
  propertySearch: createValidationMiddleware([
    ...propertyValidations.search,
    customValidations.numericRange('minPrice', 'maxPrice'),
    customValidations.numericRange('minBedrooms', 'maxBedrooms')
  ]),
  
  documentUpload: createValidationMiddleware([
    ...documentValidations.upload,
    customValidations.uniqueArray('tags')
  ]),
  
  transactionCreation: createValidationMiddleware([
    ...transactionValidations.create,
    customValidations.dateRange('contractDate', 'closingDate')
  ])
};

// Utility functions for manual validation
export const validateInput = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  password: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  uuid: (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  },
  
  phoneNumber: (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  },
  
  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  postalCode: (code: string, country: string = 'US'): boolean => {
    const patterns: { [key: string]: RegExp } = {
      US: /^\d{5}(-\d{4})?$/,
      CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
      UK: /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/,
      FR: /^\d{5}$/,
      DE: /^\d{5}$/
    };
    
    const pattern = patterns[country.toUpperCase()];
    return pattern ? pattern.test(code) : true; // Default to true for unknown countries
  },
  
  coordinates: (lat: number, lng: number): boolean => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  },
  
  dateRange: (startDate: string | Date, endDate: string | Date): boolean => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start < end;
  },
  
  fileSize: (size: number, maxSize: number): boolean => {
    return size <= maxSize;
  },
  
  mimeType: (mimeType: string, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(mimeType);
  }
};

// Request validation decorator for TypeScript classes
export const ValidateBody = (validations: ValidationChain[]) => {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const [req, res, next] = args;
      
      // Run validations
      await Promise.all(validations.map(validation => validation.run(req)));
      
      // Check for errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors: ValidationError[] = errors.array().map(error => ({
          field: error.type === 'field' ? (error as any).path : 'unknown',
          message: error.msg,
          value: error.type === 'field' ? (error as any).value : undefined
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }
      
      return method.apply(this, args);
    };
  };
};

// Export commonly used validation chains
export const commonValidationChains = {
  id: commonValidations.uuidParam(),
  pagination: commonValidations.pagination,
  search: commonValidations.search,
  email: commonValidations.email(),
  password: commonValidations.password(),
  name: (fieldName: string) => commonValidations.name(fieldName),
  positiveNumber: (fieldName: string) => commonValidations.positiveNumber(fieldName),
  date: (fieldName: string) => commonValidations.date(fieldName),
  array: (fieldName: string, min?: number, max?: number) => commonValidations.array(fieldName, min, max),
  boolean: (fieldName: string) => commonValidations.boolean(fieldName)
};

// Helper function to create custom validation middleware
export const createCustomValidation = (
  fieldName: string,
  validator: (value: any, req: Request) => boolean | Promise<boolean>,
  errorMessage: string
) => {
  return body(fieldName).custom(async (value, { req }) => {
    const isValid = await validator(value, req as Request);
    if (!isValid) {
      throw new Error(errorMessage);
    }
    return true;
  });
};

// Batch validation helper
export const validateBatch = async (
  data: any[],
  validationSchema: ValidationChain[]
): Promise<{ valid: any[]; invalid: { data: any; errors: ValidationError[] }[] }> => {
  const valid: any[] = [];
  const invalid: { data: any; errors: ValidationError[] }[] = [];
  
  for (const item of data) {
    const mockReq = { body: item } as Request;
    
    // Run validations
    await Promise.all(validationSchema.map(validation => validation.run(mockReq)));
    
    const errors = validationResult(mockReq);
    if (errors.isEmpty()) {
      valid.push(item);
    } else {
      const validationErrors: ValidationError[] = errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? (error as any).value : undefined
      }));
      
      invalid.push({ data: item, errors: validationErrors });
    }
  }
  
  return { valid, invalid };
};