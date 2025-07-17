// services/document-service/src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';

// Generic validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => {
        // Handle different error types from express-validator
        let field = 'unknown';
        if ('path' in error && typeof error.path === 'string') {
          field = error.path;
        } else if ('param' in error && typeof error.param === 'string') {
          field = error.param;
        } else if ('location' in error && typeof error.location === 'string') {
          field = error.location;
        }

        return {
          field,
          message: error.msg,
          value: 'value' in error ? error.value : undefined
        };
      })
    });
    return;
  }
  next();
};

// Helper function to create validation middleware
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map(validation => validation.run(req)));
    handleValidationErrors(req, res, next);
  };
};

// Document validation rules
export const documentValidationRules = {
  update: [
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters')
      .trim(),
    body('category')
      .optional()
      .isIn(['identity', 'medical', 'education', 'employment', 'financial', 'other'])
      .withMessage('Category must be one of: identity, medical, education, employment, financial, other'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic must be a boolean')
      .toBoolean(),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array')
      .custom((tags: string[]) => {
        if (tags && tags.length > 10) {
          throw new Error('Maximum 10 tags allowed');
        }
        if (tags && tags.some((tag: string) => typeof tag !== 'string' || tag.length > 50)) {
          throw new Error('Each tag must be a string with maximum 50 characters');
        }
        return true;
      })
  ],

  create: [
    body('originalName')
      .notEmpty()
      .withMessage('Original name is required')
      .isLength({ min: 1, max: 255 })
      .withMessage('Original name must be between 1 and 255 characters')
      .trim(),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters')
      .trim(),
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isIn(['identity', 'medical', 'education', 'employment', 'financial', 'other'])
      .withMessage('Category must be one of: identity, medical, education, employment, financial, other'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic must be a boolean')
      .toBoolean(),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array')
      .custom((tags: string[]) => {
        if (tags && tags.length > 10) {
          throw new Error('Maximum 10 tags allowed');
        }
        if (tags && tags.some((tag: string) => typeof tag !== 'string' || tag.length > 50)) {
          throw new Error('Each tag must be a string with maximum 50 characters');
        }
        return true;
      })
  ]
};

// Parameter validation rules
export const paramValidationRules = {
  documentId: [
    param('id')
      .isUUID()
      .withMessage('Document ID must be a valid UUID')
  ],
  
  adherentId: [  // Fixed typo: "adherantId" -> "adherentId"
    param('adherentId')
      .isUUID()
      .withMessage('Adherent ID must be a valid UUID')
  ]
};

// Query validation rules
export const queryValidationRules = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'updatedAt', 'originalName', 'category'])
      .withMessage('sortBy must be one of: createdAt, updatedAt, originalName, category'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('sortOrder must be either asc or desc')
  ],

  search: [
    query('q')
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters')
      .trim(),
    query('category')
      .optional()
      .isIn(['identity', 'medical', 'education', 'employment', 'financial', 'other'])
      .withMessage('Category must be one of: identity, medical, education, employment, financial, other'),
    query('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic must be a boolean')
      .toBoolean()  // Added conversion to boolean
  ],

  filter: [
    query('category')
      .optional()
      .isIn(['identity', 'medical', 'education', 'employment', 'financial', 'other'])
      .withMessage('Category must be one of: identity, medical, education, employment, financial, other'),
    query('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic must be a boolean')
      .toBoolean(),  // Added conversion to boolean
    query('tags')
      .optional()
      .customSanitizer((value) => {
        if (typeof value === 'string') {
          return value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }
        return value;
      })
      .isArray()
      .withMessage('Tags must be a comma-separated string or array'),
    query('dateFrom')
      .optional()
      .isISO8601()
      .withMessage('dateFrom must be a valid ISO 8601 date')
      .toDate(),  // Added conversion to Date
    query('dateTo')
      .optional()
      .isISO8601()
      .withMessage('dateTo must be a valid ISO 8601 date')
      .toDate()  // Added conversion to Date
      .custom((value, { req }) => {
        if (req.query?.['dateFrom'] && value <= req.query['dateFrom']) {
          throw new Error('dateTo must be after dateFrom');
        }
        return true;
      })
  ]
};

// Combined validation middlewares for easy use
export const validateDocumentUpdate = validate(documentValidationRules.update);
export const validateDocumentCreate = validate(documentValidationRules.create);
export const validatePagination = validate(queryValidationRules.pagination);
export const validateDocumentId = validate(paramValidationRules.documentId);
export const validateAdherentId = validate(paramValidationRules.adherentId);  // Added missing export
export const validateSearch = validate([...queryValidationRules.search, ...queryValidationRules.pagination]);
export const validateFilter = validate([...queryValidationRules.filter, ...queryValidationRules.pagination]);

// File upload validation
export const validateFileUpload = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
    return;
  }

  // Check file size (e.g., 10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (req.file.size > maxSize) {
    res.status(400).json({
      success: false,
      message: 'File size exceeds 10MB limit'
    });
    return;
  }

  // Check file type
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    res.status(400).json({
      success: false,
      message: 'Invalid file type. Allowed types: PDF, JPEG, JPG, PNG, DOC, DOCX'
    });
    return;
  }

  next();
};

// Bulk operations validation
export const validateBulkDelete = validate([
  body('documentIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('documentIds must be an array with 1-50 items')
    .custom((ids: string[]) => {
      if (!ids.every(id => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
        throw new Error('All document IDs must be valid UUIDs');
      }
      return true;
    })
]);

export const validateBulkUpdate = validate([
  body('documentIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('documentIds must be an array with 1-50 items')
    .custom((ids: string[]) => {
      if (!ids.every(id => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
        throw new Error('All document IDs must be valid UUIDs');
      }
      return true;
    }),
  body('updates')
    .isObject()
    .withMessage('Updates must be an object')
    .custom((updates) => {
      const allowedFields = ['category', 'isPublic', 'tags'];
      const updateKeys = Object.keys(updates);
      if (updateKeys.length === 0) {
        throw new Error('At least one update field is required');
      }
      if (!updateKeys.every(key => allowedFields.includes(key))) {
        throw new Error(`Only these fields can be updated: ${allowedFields.join(', ')}`);
      }
      
      // Validate individual update fields
      if (updates.category && !['identity', 'medical', 'education', 'employment', 'financial', 'other'].includes(updates.category)) {
        throw new Error('Category must be one of: identity, medical, education, employment, financial, other');
      }
      if (updates.isPublic !== undefined && typeof updates.isPublic !== 'boolean') {
        throw new Error('isPublic must be a boolean');
      }
      if (updates.tags && (!Array.isArray(updates.tags) || updates.tags.length > 10 || updates.tags.some((tag: string) => typeof tag !== 'string' || tag.length > 50))) {
        throw new Error('Tags must be an array of strings with maximum 10 items, each with maximum 50 characters');
      }
      
      return true;
    })
]);