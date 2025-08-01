// services/auth-service/src/config/environment.ts
export const config = {
  PORT: parseInt(process.env['PORT'] || '3007'),
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  DB_HOST: process.env['DB_HOST'] || 'localhost',
  DB_PORT: parseInt(process.env['DB_PORT'] || '5432'),
  DB_NAME: process.env['DB_NAME'] || 'adherant_documents',
  DB_USER: process.env['DB_USER'] || 'postgres',
  DB_PASSWORD: process.env['DB_PASSWORD'] || 'password',
  JWT_SECRET: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-here-make-it-long-and-random',
  JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] || '1h',
  JWT_REFRESH_EXPIRES_IN: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  BCRYPT_ROUNDS: parseInt(process.env['BCRYPT_ROUNDS'] || '12')
};


