// services/document-service/src/middleware/upload.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// Ensure upload directory exists
const ensureUploadDir = () => {
  if (!fs.existsSync(config.UPLOAD_PATH)) {
    fs.mkdirSync(config.UPLOAD_PATH, { recursive: true });
    logger.info(`Created upload directory: ${config.UPLOAD_PATH}`);
  }
};

// Initialize upload directory
ensureUploadDir();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir(); // Ensure directory exists on each upload
    cb(null, config.UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    // Create unique filename: uuid + original extension
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file type is allowed
  if (config.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warn(`File upload rejected: ${file.mimetype} not allowed - ${file.originalname}`);
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${config.ALLOWED_FILE_TYPES.join(', ')}`));
  }
};

// Main upload middleware
export const uploadDocument = multer({
  storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE, // e.g., 10MB
    files: 5, // Maximum 5 files per upload
    fields: 10, // Maximum 10 non-file fields
    fieldSize: 1024 * 1024, // 1MB per field
    fieldNameSize: 100, // 100 bytes per field name
    headerPairs: 2000 // Maximum header pairs
  },
  fileFilter
});

// Single file upload
export const uploadSingleDocument = uploadDocument.single('document');

// Multiple files upload
export const uploadMultipleDocuments = uploadDocument.array('documents', 5);

// Upload error handler middleware
export const handleUploadErrors = (error: any, req: Request, res: Response, next: NextFunction): void => {
  if (error instanceof multer.MulterError) {
    logger.error(`Multer error: ${error.message} - Code: ${error.code}`);
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        res.status(400).json({
          success: false,
          error: 'File Too Large',
          message: `File size exceeds limit of ${Math.round(config.MAX_FILE_SIZE / (1024 * 1024))}MB`
        });
        break;
      case 'LIMIT_FILE_COUNT':
        res.status(400).json({
          success: false,
          error: 'Too Many Files',
          message: 'Maximum 5 files allowed per upload'
        });
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        res.status(400).json({
          success: false,
          error: 'Unexpected File',
          message: 'Unexpected file field name'
        });
        break;
      default:
        res.status(400).json({
          success: false,
          error: 'Upload Error',
          message: error.message
        });
    }
    return;
  }

  if (error) {
    logger.error(`Upload error: ${error.message}`);
    res.status(400).json({
      success: false,
      error: 'Upload Failed',
      message: error.message
    });
    return;
  }

  next();
};

// Validation middleware to ensure file was uploaded
export const validateFileUpload = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file && !req.files) {
    res.status(400).json({
      success: false,
      error: 'No File',
      message: 'No file uploaded'
    });
    return;
  }
  next();
};

// Clean up uploaded files on error (use in error handlers)
export const cleanupUploadedFiles = (req: Request): void => {
  const files = req.files as Express.Multer.File[] || (req.file ? [req.file] : []);
  
  files.forEach(file => {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
      logger.debug(`Cleaned up uploaded file: ${file.path}`);
    }
  });
};