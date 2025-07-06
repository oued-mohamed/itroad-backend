// services/auth-service/src/models/Adherant.ts
import { pool } from '../config/database';

export interface Adherant {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdherantInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export class AdherantModel {
  static async create(adherant: CreateAdherantInput): Promise<Adherant> {
    const query = `
      INSERT INTO adherants (email, password, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, first_name as "firstName", last_name as "lastName", 
                is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;
    const values = [adherant.email, adherant.password, adherant.firstName, adherant.lastName];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<Adherant | null> {
    const query = `
      SELECT id, email, password, first_name as "firstName", last_name as "lastName",
             is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM adherants WHERE email = $1
    `;
    
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async findById(id: string): Promise<Adherant | null> {
    const query = `
      SELECT id, email, first_name as "firstName", last_name as "lastName",
             is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM adherants WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async updateLastLogin(id: string): Promise<void> {
    const query = `UPDATE adherants SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`;
    await pool.query(query, [id]);
  }
}

