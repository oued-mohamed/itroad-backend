// services/document-service/src/config/environment.ts
export const config = {
  // Server config
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  PORT: parseInt(process.env['PORT'] || '3002'),
  
  // Database config
  DB_HOST: process.env['DB_HOST'] || 'localhost',
  DB_PORT: parseInt(process.env['DB_PORT'] || '5432'),
  DB_NAME: process.env['DB_NAME'] || 'adherant_documents',
  DB_USER: process.env['DB_USER'] || 'postgres',
  DB_PASSWORD: process.env['DB_PASSWORD'] || 'password',
  
  // JWT config
  JWT_SECRET: process.env['JWT_SECRET'] || 'your-fallback-secret',
  JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] || '1h',
  
  // Client config
  CLIENT_URL: process.env['CLIENT_URL'] || 'http://localhost:3000',
  
  // Upload configs
  UPLOAD_PATH: process.env['UPLOAD_PATH'] || './uploads/documents',
  MAX_FILE_SIZE: parseInt(process.env['MAX_FILE_SIZE'] || '10485760'), // 10MB in bytes
  ALLOWED_FILE_TYPES: process.env['ALLOWED_FILE_TYPES']?.split(',') || [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};
