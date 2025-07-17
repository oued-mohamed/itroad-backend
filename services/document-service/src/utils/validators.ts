// services/document-service/src/utils/validators.ts
import { body, param, query } from 'express-validator';

export const documentValidators = {
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
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each tag must be between 1 and 50 characters'),
    body('isPrivate')
      .optional()
      .isBoolean()
      .withMessage('isPrivate must be a boolean'),
    body('expirationDate')
      .optional()
      .isISO8601()
      .withMessage('Expiration date must be a valid ISO 8601 date')
  ],

  update: [
    param('id')
      .isUUID()
      .withMessage('Document ID must be a valid UUID'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Title must be between 1 and 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('category')
      .optional()
      .isIn(['identity', 'medical', 'education', 'employment', 'financial', 'legal', 'insurance', 'property', 'other'])
      .withMessage('Invalid document category'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each tag must be between 1 and 50 characters'),
    body('isPrivate')
      .optional()
      .isBoolean()
      .withMessage('isPrivate must be a boolean'),
    body('expirationDate')
      .optional()
      .isISO8601()
      .withMessage('Expiration date must be a valid ISO 8601 date')
  ],

  getDocument: [
    param('id')
      .isUUID()
      .withMessage('Document ID must be a valid UUID')
  ],

  deleteDocument: [
    param('id')
      .isUUID()
      .withMessage('Document ID must be a valid UUID')
  ],

  listDocuments: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('category')
      .optional()
      .isIn(['identity', 'medical', 'education', 'employment', 'financial', 'legal', 'insurance', 'property', 'other'])
      .withMessage('Invalid document category'),
    query('search')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Search term must be between 1 and 255 characters'),
    query('sortBy')
      .optional()
      .isIn(['title', 'category', 'createdAt', 'updatedAt', 'expirationDate'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
  ],

  shareDocument: [
    param('id')
      .isUUID()
      .withMessage('Document ID must be a valid UUID'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('permissions')
      .isIn(['view', 'download'])
      .withMessage('Permissions must be view or download'),
    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('Expiration date must be a valid ISO 8601 date'),
    body('message')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Message must be less than 500 characters')
  ],

  bulkOperation: [
    body('documentIds')
      .isArray({ min: 1 })
      .withMessage('Document IDs array is required and must not be empty'),
    body('documentIds.*')
      .isUUID()
      .withMessage('Each document ID must be a valid UUID'),
    body('operation')
      .isIn(['delete', 'archive', 'unarchive', 'updateCategory'])
      .withMessage('Invalid bulk operation'),
    body('category')
      .if(body('operation').equals('updateCategory'))
      .isIn(['identity', 'medical', 'education', 'employment', 'financial', 'legal', 'insurance', 'property', 'other'])
      .withMessage('Category is required for updateCategory operation')
  ]
};

export const fileValidators = {
  validateFileType: (allowedTypes: string[]) => {
    return (file: Express.Multer.File) => {
      return allowedTypes.includes(file.mimetype);
    };
  },

  validateFileSize: (maxSizeInBytes: number) => {
    return (file: Express.Multer.File) => {
      return file.size <= maxSizeInBytes;
    };
  },

  validateFileName: (file: Express.Multer.File) => {
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.txt', '.xls', '.xlsx'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    return validExtensions.includes(fileExtension);
  }
};

export const documentConstants = {
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 5,
  ALLOWED_CATEGORIES: [
    'identity',
    'medical', 
    'education',
    'employment',
    'financial',
    'legal',
    'insurance',
    'property',
    'other'
  ],
  DEFAULT_PAGINATION: {
    page: 1,
    limit: 20,
    maxLimit: 100
  }
};

export const sanitizers = {
  sanitizeFileName: (fileName: string): string => {
    // Remove special characters and spaces, keep only alphanumeric, dots, hyphens, and underscores
    return fileName.replace(/[^a-zA-Z0-9.-_]/g, '_').toLowerCase();
  },

  sanitizeSearchTerm: (searchTerm: string): string => {
    // Remove SQL injection patterns and normalize
    return searchTerm
      .replace(/['"\\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  sanitizeTags: (tags: string[]): string[] => {
    return tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length <= 50)
      .slice(0, 10); // Limit to 10 tags
  }
};

export const documentHelpers = {
  generateDocumentPath: (userId: string, category: string, fileName: string): string => {
    const timestamp = Date.now();
    const sanitizedFileName = sanitizers.sanitizeFileName(fileName);
    return `documents/${userId}/${category}/${timestamp}_${sanitizedFileName}`;
  },

  getFileExtension: (fileName: string): string => {
    return fileName.toLowerCase().substring(fileName.lastIndexOf('.') + 1);
  },

  getMimeTypeFromExtension: (extension: string): string => {
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    return mimeTypes[extension] || 'application/octet-stream';
  },

  isImageFile: (fileName: string): boolean => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const extension = documentHelpers.getFileExtension(fileName);
    return imageExtensions.includes(extension);
  },

  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  validateDocumentAccess: (document: any, userId: string, requiredPermission: 'view' | 'edit' | 'delete' = 'view'): boolean => {
    // Owner has all permissions
    if (document.userId === userId) {
      return true;
    }

    // Check shared permissions
    if (document.sharedWith && document.sharedWith.length > 0) {
      const userShare = document.sharedWith.find((share: any) => share.userId === userId);
      if (userShare) {
        switch (requiredPermission) {
          case 'view':
            return ['view', 'edit', 'delete'].includes(userShare.permission);
          case 'edit':
            return ['edit', 'delete'].includes(userShare.permission);
          case 'delete':
            return userShare.permission === 'delete';
          default:
            return false;
        }
      }
    }

    return false;
  }
};