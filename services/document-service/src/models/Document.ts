// services/document-service/src/models/Document.ts
import { pool } from '../config/database';

export interface Document {
  id: string;
  adherantId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  description?: string;
  category: 'identity' | 'medical' | 'education' | 'employment' | 'financial' | 'other';
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentInput {
  adherantId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  description?: string;
  category: 'identity' | 'medical' | 'education' | 'employment' | 'financial' | 'other';
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateDocumentInput {
  description?: string;
  category?: 'identity' | 'medical' | 'education' | 'employment' | 'financial' | 'other';
  isPublic?: boolean;
  tags?: string[];
}

export class DocumentModel {
  static async create(document: CreateDocumentInput): Promise<Document> {
    const query = `
      INSERT INTO documents (adherant_id, filename, original_name, mime_type, size, path, url, description, category, is_public, tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, adherant_id as "adherantId", filename, original_name as "originalName", 
                mime_type as "mimeType", size, path, url, description, category, 
                is_public as "isPublic", tags, created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const values = [
      document.adherantId, document.filename, document.originalName, document.mimeType,
      document.size, document.path, document.url, document.description,
      document.category, document.isPublic || false, document.tags || []
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByAdherantId(adherantId: string, page: number = 1, limit: number = 10): Promise<{ documents: Document[], total: number }> {
    const offset = (page - 1) * limit;
    
    const countQuery = `SELECT COUNT(*) FROM documents WHERE adherant_id = $1`;
    const countResult = await pool.query(countQuery, [adherantId]);
    const total = parseInt(countResult.rows[0].count);
    
    const query = `
      SELECT id, adherant_id as "adherantId", filename, original_name as "originalName",
             mime_type as "mimeType", size, path, url, description, category,
             is_public as "isPublic", tags, created_at as "createdAt", updated_at as "updatedAt"
      FROM documents 
      WHERE adherant_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [adherantId, limit, offset]);
    return {
      documents: result.rows,
      total
    };
  }

  static async findById(id: string, adherantId?: string): Promise<Document | null> {
    let query = `
      SELECT id, adherant_id as "adherantId", filename, original_name as "originalName",
             mime_type as "mimeType", size, path, url, description, category,
             is_public as "isPublic", tags, created_at as "createdAt", updated_at as "updatedAt"
      FROM documents WHERE id = $1
    `;
    
    const values = [id];
    
    if (adherantId) {
      query += ` AND adherant_id = $2`;
      values.push(adherantId);
    }
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async update(id: string, adherantId: string, updates: UpdateDocumentInput): Promise<Document | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = key === 'isPublic' ? 'is_public' : key;
        fields.push(`${dbField} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return await DocumentModel.findById(id, adherantId);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, adherantId);

    const query = `
      UPDATE documents 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount} AND adherant_id = $${paramCount + 1}
      RETURNING id, adherant_id as "adherantId", filename, original_name as "originalName",
                mime_type as "mimeType", size, path, url, description, category,
                is_public as "isPublic", tags, created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: string, adherantId: string): Promise<Document | null> {
    const query = `
      DELETE FROM documents 
      WHERE id = $1 AND adherant_id = $2
      RETURNING id, adherant_id as "adherantId", filename, original_name as "originalName",
                mime_type as "mimeType", size, path, url, description, category,
                is_public as "isPublic", tags, created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const result = await pool.query(query, [id, adherantId]);
    return result.rows[0] || null;
  }

  static async findByCategory(adherantId: string, category: string): Promise<Document[]> {
    const query = `
      SELECT id, adherant_id as "adherantId", filename, original_name as "originalName",
             mime_type as "mimeType", size, path, url, description, category,
             is_public as "isPublic", tags, created_at as "createdAt", updated_at as "updatedAt"
      FROM documents 
      WHERE adherant_id = $1 AND category = $2 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [adherantId, category]);
    return result.rows;
  }

  static async searchDocuments(adherantId: string, searchTerm: string): Promise<Document[]> {
    const query = `
      SELECT id, adherant_id as "adherantId", filename, original_name as "originalName",
             mime_type as "mimeType", size, path, url, description, category,
             is_public as "isPublic", tags, created_at as "createdAt", updated_at as "updatedAt"
      FROM documents 
      WHERE adherant_id = $1 AND (
        original_name ILIKE $2 OR 
        description ILIKE $2 OR 
        category ILIKE $2 OR
        array_to_string(tags, ' ') ILIKE $2
      )
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [adherantId, `%${searchTerm}%`]);
    return result.rows;
  }
}