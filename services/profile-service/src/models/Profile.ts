// services/profile-service/src/models/Profile.ts
import { pool } from '../config/database';

export interface Profile {
  id: string;
  adherantId: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProfileInput {
  adherantId: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  website?: string;
}

export interface UpdateProfileInput {
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  website?: string;
}

export class ProfileModel {
  static async create(profile: CreateProfileInput): Promise<Profile> {
    const query = `
      INSERT INTO profiles (adherant_id, phone, address, city, country, postal_code, avatar, date_of_birth, gender, bio, website)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, adherant_id as "adherantId", phone, address, city, country, postal_code as "postalCode",
                avatar, date_of_birth as "dateOfBirth", gender, bio, website,
                created_at as "createdAt", updated_at as "updatedAt"
    `;
    const values = [
      profile.adherantId, profile.phone, profile.address, profile.city,
      profile.country, profile.postalCode, profile.avatar, profile.dateOfBirth,
      profile.gender, profile.bio, profile.website
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByAdherantId(adherantId: string): Promise<Profile | null> {
    const query = `
      SELECT id, adherant_id as "adherantId", phone, address, city, country, postal_code as "postalCode",
             avatar, date_of_birth as "dateOfBirth", gender, bio, website,
             created_at as "createdAt", updated_at as "updatedAt"
      FROM profiles WHERE adherant_id = $1
    `;
    
    const result = await pool.query(query, [adherantId]);
    return result.rows[0] || null;
  }

  static async update(adherantId: string, updates: UpdateProfileInput): Promise<Profile | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = key === 'postalCode' ? 'postal_code' : 
                       key === 'dateOfBirth' ? 'date_of_birth' : key;
        fields.push(`${dbField} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return await ProfileModel.findByAdherantId(adherantId);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(adherantId);

    const query = `
      UPDATE profiles 
      SET ${fields.join(', ')} 
      WHERE adherant_id = $${paramCount}
      RETURNING id, adherant_id as "adherantId", phone, address, city, country, postal_code as "postalCode",
                avatar, date_of_birth as "dateOfBirth", gender, bio, website,
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(adherantId: string): Promise<void> {
    const query = `DELETE FROM profiles WHERE adherant_id = $1`;
    await pool.query(query, [adherantId]);
  }
}