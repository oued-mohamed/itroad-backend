// services/property-service/src/config/database.ts
import { Pool } from 'pg';
import { config } from './environment';
import { logger } from '../utils/logger';

const pool = new Pool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const connectDB = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('✅ Database connected successfully:', result.rows[0]);
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

export { pool };
export default pool;
