// shared/middleware/upload.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { createError } from './errorHandler';

// Configuration interface
interface UploadConfig {
  destination: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  maxFiles: number;
  preserveOriginalName?: boolean;
  createDirectories?: boolean;
}

// Default configurations for different file types
export const uploadConfigs = {
  images: {
    destination: './uploads/images',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    maxFiles: 10,
    createDirectories: true
  },
  documents: {
    destination: './uploads/documents',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'],
    maxFiles: 5,
    createDirectories: true
  },
  avatars: {
    destination: './uploads/avatars',
    maxFileSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    allowedExtensions: ['.jpg', '.jpeg', '.png'],
    maxFiles: 1,
    createDirectories: true
  }
};

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Generate unique filename
const generateFileName = (originalName: string, preserveOriginal = false): string => {
  if (preserveOriginal) {
    return originalName;
  }
  
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, extension)
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 50); // Limit length
  
  return `${baseName}_${timestamp}_${random}${extension}`;
};

// Create storage configuration
const createStorage = (config: UploadConfig) => {
  return multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
      if (config.createDirectories) {
        ensureDirectoryExists(config.destination);
      }
      cb(null, config.destination);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
      const fileName = generateFileName(file.originalname, config.preserveOriginalName);
      cb(null, fileName);
    }
  });
};

// File filter function
const createFileFilter = (config: UploadConfig) => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check MIME type
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        createError(
          `Invalid file type. Allowed types: ${config.allowedMimeTypes.join(', ')}`,
          400
        )
      );
    }
    
    // Check file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!config.allowedExtensions.includes(fileExtension)) {
      return cb(
        createError(
          `Invalid file extension. Allowed extensions: ${config.allowedExtensions.join(', ')}`,
          400
        )
      );
    }
    
    cb(null, true);
  };
};

// Create upload middleware
export const createUploadMiddleware = (configName: keyof typeof uploadConfigs | UploadConfig) => {
  const config = typeof configName === 'string' ? uploadConfigs[configName] : configName;
  
  return multer({
    storage: createStorage(config),
    fileFilter: createFileFilter(config),
    limits: {
      fileSize: config.maxFileSize,
      files: config.maxFiles
    }
  });
};

// Predefined upload middlewares
export const uploadImage = createUploadMiddleware('images');
export const uploadDocument = createUploadMiddleware('documents');
export const uploadAvatar = createUploadMiddleware('avatars');

// Multiple file upload middlewares
export const uploadImages = uploadImage.array('images', uploadConfigs.images.maxFiles);
export const uploadDocuments = uploadDocument.array('documents', uploadConfigs.documents.maxFiles);
export const uploadSingleImage = uploadImage.single('image');
export const uploadSingleDocument = uploadDocument.single('document');
export const uploadSingleAvatar = uploadAvatar.single('avatar');

// Mixed file upload (images and documents)
export const uploadMixed = uploadImage.fields([
  { name: 'images', maxCount: uploadConfigs.images.maxFiles },
  { name: 'documents', maxCount: uploadConfigs.documents.maxFiles }
]);

// Property-specific upload middleware
export const uploadPropertyFiles = uploadImage.fields([
  { name: 'images', maxCount: 20 },
  { name: 'documents', maxCount: 10 },
  { name: 'floorPlan', maxCount: 5 },
  { name: 'virtualTour', maxCount: 1 }
]);

// Error handling middleware for multer
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    let statusCode = 400;
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds the maximum allowed limit';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in multipart data';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        break;
    }
    
    return res.status(statusCode).json({
      success: false,
      message,
      error: error.code
    });
  }
  
  next(error);
};

// Utility function to clean up uploaded files on error
export const cleanupFiles = (files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] }) => {
  const filesToDelete: Express.Multer.File[] = [];
  
  if (Array.isArray(files)) {
    filesToDelete.push(...files);
  } else if (files) {
    Object.values(files).forEach(fileArray => {
      filesToDelete.push(...fileArray);
    });
  }
  
  filesToDelete.forEach(file => {
    fs.unlink(file.path, (err) => {
      if (err) {
        console.error('Error deleting file:', file.path, err);
      }
    });
  });
};

// File validation utilities
export const validateFileSize = (file: Express.Multer.File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

export const validateFileType = (file: Express.Multer.File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.mimetype);
};

export const validateFileExtension = (file: Express.Multer.File, allowedExtensions: string[]): boolean => {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  return allowedExtensions.includes(fileExtension);
};

// Get file information
export const getFileInfo = (file: Express.Multer.File) => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    extension: path.extname(file.originalname).toLowerCase(),
    url: `/uploads/${path.relative('./uploads', file.path)}`
  };
};

