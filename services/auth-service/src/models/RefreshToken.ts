// services/auth-service/src/models/RefreshToken.ts
import { pool } from '../config/database';

export interface RefreshToken {
  id: string;
  token: string;
  adherantId: string;
  expiresAt: Date;
  createdAt: Date;
}

export class RefreshTokenModel {
  static async create(token: string, adherantId: string, expiresAt: Date): Promise<RefreshToken> {
    const query = `
      INSERT INTO refresh_tokens (token, adherant_id, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, token, adherant_id as "adherantId", expires_at as "expiresAt", created_at as "createdAt"
    `;
    
    const result = await pool.query(query, [token, adherantId, expiresAt]);
    return result.rows[0];
  }

  static async findByToken(token: string): Promise<RefreshToken | null> {
    const query = `
      SELECT id, token, adherant_id as "adherantId", expires_at as "expiresAt", created_at as "createdAt"
      FROM refresh_tokens 
      WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP
    `;
    
    const result = await pool.query(query, [token]);
    return result.rows[0] || null;
  }

  static async deleteByToken(token: string): Promise<void> {
    const query = `DELETE FROM refresh_tokens WHERE token = $1`;
    await pool.query(query, [token]);
  }

  static async deleteByAdherantId(adherantId: string): Promise<void> {
    const query = `DELETE FROM refresh_tokens WHERE adherant_id = $1`;
    await pool.query(query, [adherantId]);
  }

  static async cleanup(): Promise<void> {
    const query = `DELETE FROM refresh_tokens WHERE expires_at <= CURRENT_TIMESTAMP`;
    await pool.query(query);
  }
}