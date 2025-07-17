// services/auth-service/src/models/User.ts
import { pool } from '../config/database';

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'agent' | 'client';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'agent' | 'client';
}

export class UserModel {
  static async create(user: CreateUserInput): Promise<User> {
    const query = `
      INSERT INTO users (email, password, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name as "firstName", last_name as "lastName", role,
                is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;
    const values = [
      user.email, 
      user.password, 
      user.firstName, 
      user.lastName, 
      user.role || 'client'
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, email, password, first_name as "firstName", last_name as "lastName", role,
             is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM users WHERE email = $1
    `;

    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const query = `
      SELECT id, email, first_name as "firstName", last_name as "lastName", role,
             is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM users WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async updateLastLogin(id: string): Promise<void> {
    const query = `UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`;
    await pool.query(query, [id]);
  }

  static async updateUser(id: string, updates: Partial<CreateUserInput>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = key === 'firstName' ? 'first_name' : 
                       key === 'lastName' ? 'last_name' : key;
        fields.push(`${dbField} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, first_name as "firstName", last_name as "lastName", role,
                is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async deactivateUser(id: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async reactivateUser(id: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET is_active = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async updateUserRole(id: string, newRole: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET role = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    const result = await pool.query(query, [newRole, id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async changePassword(id: string, newPassword: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    const result = await pool.query(query, [newPassword, id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async findByRole(role: string, limit = 20, offset = 0): Promise<{
    users: User[];
    total: number;
  }> {
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users WHERE role = $1 AND is_active = true`;
    const countResult = await pool.query(countQuery, [role]);
    const total = parseInt(countResult.rows[0].count);

    // Get users
    const query = `
      SELECT id, email, first_name as "firstName", last_name as "lastName", role,
             is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM users 
      WHERE role = $1 AND is_active = true
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [role, limit, offset]);
    
    return {
      users: result.rows,
      total
    };
  }

  static async getUsers(limit = 20, offset = 0, roleFilter?: string, searchTerm?: string): Promise<{
    users: User[];
    total: number;
  }> {
    let whereConditions = ['is_active = true'];
    const values: any[] = [];
    let paramIndex = 1;

    if (roleFilter) {
      whereConditions.push(`role = $${paramIndex++}`);
      values.push(roleFilter);
    }

    if (searchTerm) {
      whereConditions.push(`(first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      values.push(`%${searchTerm}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get users
    values.push(limit, offset);
    const query = `
      SELECT id, email, first_name as "firstName", last_name as "lastName", role,
             is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM users 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await pool.query(query, values);
    
    return {
      users: result.rows,
      total
    };
  }

  static async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: { [key: string]: number };
    recentUsers: number;
  }> {
    // Total users
    const totalQuery = `SELECT COUNT(*) as total FROM users`;
    const totalResult = await pool.query(totalQuery);
    const totalUsers = parseInt(totalResult.rows[0].total);

    // Active users
    const activeQuery = `SELECT COUNT(*) as active FROM users WHERE is_active = true`;
    const activeResult = await pool.query(activeQuery);
    const activeUsers = parseInt(activeResult.rows[0].active);

    // Users by role
    const roleQuery = `
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE is_active = true
      GROUP BY role
    `;
    const roleResult = await pool.query(roleQuery);
    const usersByRole = roleResult.rows.reduce((acc: any, row: any) => {
      acc[row.role] = parseInt(row.count);
      return acc;
    }, {});

    // Recent users (last 30 days)
    const recentQuery = `
      SELECT COUNT(*) as recent 
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `;
    const recentResult = await pool.query(recentQuery);
    const recentUsers = parseInt(recentResult.rows[0].recent);

    return {
      totalUsers,
      activeUsers,
      usersByRole,
      recentUsers
    };
  }
}