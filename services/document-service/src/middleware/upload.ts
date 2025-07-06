// services/document-service/src/middleware/upload.ts
import multer from 'multer';
import path from 'path';
import { config } from '../config/environment';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (config.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

export const uploadDocument = multer({
  storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE,
    files: 5 // Maximum 5 files per upload
  },
  fileFilter
});

