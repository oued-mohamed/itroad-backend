// services/profile-service/src/config/environment.ts
export const config = {
  PORT: process.env['PORT'] || 3003,
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  DB_HOST: process.env['DB_HOST'] || 'localhost',
  DB_PORT: parseInt(process.env['DB_PORT'] || '5432'),
  DB_NAME: process.env['DB_NAME'] || 'adherant_documents',
  DB_USER: process.env['DB_USER'] || 'postgres',
  DB_PASSWORD: process.env['DB_PASSWORD'] || 'password',
  JWT_SECRET: process.env['JWT_SECRET'] || 'your-secret-key',
  UPLOAD_PATH: process.env['UPLOAD_PATH'] || 'uploads/avatars',
  MAX_FILE_SIZE: parseInt(process.env['MAX_FILE_SIZE'] || '5242880'), // 5MB
  ALLOWED_AVATAR_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    BASE_URL: process.env['BASE_URL'] || 'http://localhost:3002',


};


