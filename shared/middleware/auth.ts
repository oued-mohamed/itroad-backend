// shared/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface JwtPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-here-make-it-long-and-random';

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// shared/middleware/errorHandler.ts
// (imports removed, already imported at the top)

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = (error: AppError, req: Request, res: Response, next: NextFunction) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // PostgreSQL errors
  if (error.name === 'DatabaseError') {
    statusCode = 500;
    message = 'Database error';
  }

  console.error(`Error ${statusCode}: ${message}`, error);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env['NODE_ENV'] === 'development' && { stack: error.stack })
  });
};

// shared/middleware/validation.ts
import { body, query, param, validationResult } from 'express-validator';
// (imports removed, already imported at the top)

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Auth validations
export const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('role').optional().isIn(['admin', 'agent', 'client']),
  handleValidationErrors
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  handleValidationErrors
];

// Property validations
export const validateProperty = [
  body('title').trim().isLength({ min: 1, max: 255 }),
  body('description').trim().isLength({ min: 1 }),
  body('type').isIn(['house', 'apartment', 'condo', 'townhouse', 'villa', 'studio', 'duplex', 'penthouse', 'commercial', 'office', 'retail', 'warehouse', 'land', 'other']),
  body('status').optional().isIn(['available', 'under_contract', 'sold', 'rented', 'off_market', 'pending']),
  body('price').isFloat({ min: 0 }),
  body('currency').optional().isLength({ min: 3, max: 3 }),
  body('address').trim().isLength({ min: 1 }),
  body('city').trim().isLength({ min: 1 }),
  body('state').trim().isLength({ min: 1 }),
  body('country').trim().isLength({ min: 1 }),
  body('area').isFloat({ min: 0 }),
  body('areaUnit').optional().isIn(['sqft', 'sqm']),
  body('bedrooms').optional().isInt({ min: 0 }),
  body('bathrooms').optional().isFloat({ min: 0 }),
  body('yearBuilt').optional().isInt({ min: 1800, max: new Date().getFullYear() + 2 }),
  body('features').optional().isArray(),
  handleValidationErrors
];

export const validatePropertyUpdate = [
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim().isLength({ min: 1 }),
  body('type').optional().isIn(['house', 'apartment', 'condo', 'townhouse', 'villa', 'studio', 'duplex', 'penthouse', 'commercial', 'office', 'retail', 'warehouse', 'land', 'other']),
  body('status').optional().isIn(['available', 'under_contract', 'sold', 'rented', 'off_market', 'pending']),
  body('price').optional().isFloat({ min: 0 }),
  body('currency').optional().isLength({ min: 3, max: 3 }),
  body('area').optional().isFloat({ min: 0 }),
  handleValidationErrors
];

// Transaction validations
export const validateTransaction = [
  body('propertyId').isUUID(),
  body('clientId').isUUID(),
  body('type').isIn(['sale', 'rental', 'lease']),
  body('status').optional().isIn(['inquiry', 'viewing_scheduled', 'offer_made', 'offer_accepted', 'under_contract', 'inspection_pending', 'inspection_completed', 'financing_pending', 'financing_approved', 'appraisal_pending', 'appraisal_completed', 'closing_scheduled', 'closed', 'cancelled', 'on_hold']),
  body('price').isFloat({ min: 0 }),
  body('commission').isFloat({ min: 0 }),
  body('commissionType').optional().isIn(['percentage', 'fixed']),
  handleValidationErrors
];

export const validateTransactionUpdate = [
  body('status').optional().isIn(['inquiry', 'viewing_scheduled', 'offer_made', 'offer_accepted', 'under_contract', 'inspection_pending', 'inspection_completed', 'financing_pending', 'financing_approved', 'appraisal_pending', 'appraisal_completed', 'closing_scheduled', 'closed', 'cancelled', 'on_hold']),
  body('price').optional().isFloat({ min: 0 }),
  body('commission').optional().isFloat({ min: 0 }),
  body('appraisalValue').optional().isFloat({ min: 0 }),
  body('downPayment').optional().isFloat({ min: 0 }),
  body('loanAmount').optional().isFloat({ min: 0 }),
  handleValidationErrors
];

// shared/middleware/upload.ts
import multer from 'multer';
import path from 'path';

// Property images storage
const propertyImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/property-images/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Document storage
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const entityType = req.body.entityType || 'user';
    cb(null, `uploads/${entityType}-documents/`);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Avatar storage
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for images
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// File filter for documents
const documentFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed!'));
  }
};

export const uploadPropertyImages = multer({
  storage: propertyImageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

export const uploadDocuments = multer({
  storage: documentStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  }
});

// shared/utils/formatters.ts
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatNumber = (number: number): string => {
  return new Intl.NumberFormat('en-US').format(number);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const formatPropertyTitle = (property: any): string => {
  const { bedrooms, bathrooms, type, city, state } = property;
  let title = '';
  
  if (bedrooms) title += `${bedrooms} bed `;
  if (bathrooms) title += `${bathrooms} bath `;
  title += `${type} in ${city}, ${state}`;
  
  return title;
};

export const formatArea = (area: number, unit: string = 'sqft'): string => {
  return `${formatNumber(area)} ${unit}`;
};

export const calculateCommission = (
  price: number, 
  commission: number, 
  commissionType: 'percentage' | 'fixed'
): number => {
  if (commissionType === 'percentage') {
    return (price * commission) / 100;
  }
  return commission;
};

// shared/utils/helpers.ts
import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => {
  return uuidv4();
};

export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

export const generateFileName = (originalName: string): string => {
  const extension = getFileExtension(originalName);
  return `${uuidv4()}.${extension}`;
};

export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in kilometers
  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const parseQueryParams = (query: any) => {
  const parsed: any = {};
  
  Object.keys(query).forEach(key => {
    const value = query[key];
    
    if (value === 'true') {
      parsed[key] = true;
    } else if (value === 'false') {
      parsed[key] = false;
    } else if (!isNaN(value) && !isNaN(parseFloat(value))) {
      parsed[key] = parseFloat(value);
    } else {
      parsed[key] = value;
    }
  });
  
  return parsed;
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .replace(/['"]/g, '') // Remove quotes that could break SQL
    .substring(0, 1000); // Limit length
};

export const generatePropertySlug = (property: any): string => {
  const { title, city, state, price } = property;
  const priceK = Math.round(price / 1000);
  return slugify(`${title}-${city}-${state}-${priceK}k`);
};

export const getImageUrl = (filename: string, type: 'property' | 'avatar' | 'document' = 'property'): string => {
  const baseUrl = process.env['BASE_URL'] || 'http://localhost:3000';
  return `${baseUrl}/uploads/${type === 'property' ? 'property-images' : type === 'avatar' ? 'avatars' : 'documents'}/${filename}`;
};