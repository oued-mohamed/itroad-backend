// services/profile-service/src/utils/validators.ts
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const validatePostalCode = (postalCode: string, country: string = 'US'): boolean => {
  const patterns: { [key: string]: RegExp } = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
    UK: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/,
    FR: /^\d{5}$/,
    DE: /^\d{5}$/,
  };

  const pattern = patterns[country.toUpperCase()];
  return pattern ? pattern.test(postalCode) : true; // Allow if pattern not found
};

export const validateWebsiteUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

export const validateAge = (dateOfBirth: Date): boolean => {
  const today = new Date();
  const age = today.getFullYear() - dateOfBirth.getFullYear();
  return age >= 18 && age <= 120;
};

export const validateLicenseNumber = (licenseNumber: string): boolean => {
  // Basic validation - alphanumeric, 5-20 characters
  const licenseRegex = /^[A-Za-z0-9]{5,20}$/;
  return licenseRegex.test(licenseNumber);
};

export const validateExperience = (experience: number): boolean => {
  return experience >= 0 && experience <= 50;
};

export const validateBudget = (budget: number): boolean => {
  return budget >= 0 && budget <= 100000000; // Max 100 million
};

// services/document-service/src/utils/validators.ts
import path from 'path';

export const validateFileType = (filename: string, allowedTypes: string[]): boolean => {
  const ext = path.extname(filename).toLowerCase();
  return allowedTypes.includes(ext);
};

export const validateFileSize = (size: number, maxSize: number = 10 * 1024 * 1024): boolean => {
  return size <= maxSize;
};

export const validateDocumentCategory = (category: string): boolean => {
  const validCategories = [
    'identity', 'medical', 'education', 'employment', 
    'financial', 'property', 'transaction', 'other'
  ];
  return validCategories.includes(category);
};

export const validateDocumentType = (type: string): boolean => {
  const validTypes = [
    'deed', 'title', 'survey', 'inspection_report', 'appraisal',
    'floor_plan', 'property_disclosure', 'purchase_agreement',
    'lease_agreement', 'rental_application', 'offer_letter',
    'counter_offer', 'closing_disclosure', 'drivers_license',
    'passport', 'national_id', 'bank_statement', 'tax_return',
    'pay_stub', 'credit_report', 'pre_approval_letter',
    'license', 'certification', 'mls_listing', 'contract',
    'invoice', 'receipt', 'photo', 'video', 'other'
  ];
  return validTypes.includes(type);
};

export const sanitizeFilename = (filename: string): string => {
  // Remove special characters and spaces
  return filename
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

export const getFileCategory = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word')) return 'document';
  if (mimeType.includes('text')) return 'text';
  return 'other';
};

// services/document-service/src/config/storage.ts
export const storageConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'text/plain'
  ],
  uploadPaths: {
    user: 'uploads/user-documents/',
    property: 'uploads/property-documents/',
    transaction: 'uploads/transaction-documents/'
  },
  baseUrl: process.env['BASE_URL'] || 'http://localhost:3004'
};

// services/property-service/src/config/environment.ts (Complete version)
export const config = {
  PORT: parseInt(process.env['PORT'] || '3003'),
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  DB_HOST: process.env['DB_HOST'] || 'localhost',
  DB_PORT: parseInt(process.env['DB_PORT'] || '5432'),
  DB_NAME: process.env['DB_NAME'] || 'adherant_real_estate',
  DB_USER: process.env['DB_USER'] || 'postgres',
  DB_PASSWORD: process.env['DB_PASSWORD'] || 'password',
  JWT_SECRET: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-here-make-it-long-and-random',
  BASE_URL: process.env['BASE_URL'] || 'http://localhost:3003',
  MAX_FILE_SIZE: parseInt(process.env['MAX_FILE_SIZE'] || '10485760'), // 10MB
  MAX_FILES_PER_PROPERTY: parseInt(process.env['MAX_FILES_PER_PROPERTY'] || '10'),
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  IMAGE_QUALITY: {
    main: 85,
    thumbnail: 80
  },
  IMAGE_SIZES: {
    main: { width: 1200, height: 800 },
    thumbnail: { width: 300, height: 200 }
  }
};



