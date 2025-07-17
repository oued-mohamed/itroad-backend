// services/document-service/src/config/database.ts
import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

let pool: Pool | null = null;

export const connectDB = async (): Promise<Pool> => {
  try {
    if (pool) {
      return pool;
    }

    // ✅ Remove debug logging for production
    // console.log('🔍 Debug - DB Config:', { ... });

    pool = new Pool({
      host: config.DB_HOST,
      port: config.DB_PORT,
      database: config.DB_NAME,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      max: 20, // Maximum connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000, // 5 second timeout
      ssl: config.NODE_ENV === 'production'
    });

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('✅ Database connected successfully');
    return pool;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return pool;
};

export const closeDB = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection closed');
  }
};