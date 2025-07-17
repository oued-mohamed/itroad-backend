// services/document-service/src/config/storage.ts
import path from 'path';
import fs from 'fs/promises';

export interface StorageConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  uploadPaths: {
    [key: string]: string;
  };
  baseUrl: string;
  thumbnailSizes: {
    small: { width: number; height: number };
    medium: { width: number; height: number };
  };
}

export const storageConfig: StorageConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain',
    'text/csv',
    
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    
    // Archives (if needed)
    'application/zip',
    'application/x-rar-compressed'
  ],
  uploadPaths: {
    user: 'uploads/user-documents/',
    property: 'uploads/property-documents/',
    transaction: 'uploads/transaction-documents/',
    temp: 'uploads/temp/',
    avatars: 'uploads/avatars/'
  },
  baseUrl: process.env['BASE_URL'] || 'http://localhost:3004',
  thumbnailSizes: {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 }
  }
};

// Utility functions for storage operations
export class StorageUtils {
  /**
   * Ensure upload directories exist
   */
  static async ensureDirectoriesExist(): Promise<void> {
    try {
      for (const [key, dirPath] of Object.entries(storageConfig.uploadPaths)) {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`✓ Directory ensured: ${dirPath}`);
      }
    } catch (error) {
      console.error('Error creating upload directories:', error);
      throw error;
    }
  }

  /**
   * Get upload path based on entity type
   */
  static getUploadPath(entityType: string = 'user'): string {
    return storageConfig.uploadPaths[entityType] || storageConfig.uploadPaths.user;
  }

  /**
   * Generate file URL
   */
  static generateFileUrl(filename: string, entityType: string = 'user'): string {
    const folderName = entityType === 'user' ? 'user-documents' : 
                      entityType === 'property' ? 'property-documents' :
                      entityType === 'transaction' ? 'transaction-documents' : 'user-documents';
    
    return `${storageConfig.baseUrl}/uploads/${folderName}/${filename}`;
  }

  /**
   * Validate file type
   */
  static isAllowedFileType(mimeType: string): boolean {
    return storageConfig.allowedMimeTypes.includes(mimeType);
  }

  /**
   * Validate file size
   */
  static isValidFileSize(size: number): boolean {
    return size <= storageConfig.maxFileSize;
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  /**
   * Check if file is an image
   */
  static isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Check if file is a document
   */
  static isDocumentFile(mimeType: string): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/plain',
      'text/csv'
    ];
    return documentTypes.includes(mimeType);
  }

  /**
   * Get human-readable file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Delete file from storage
   */
  static async deleteFile(filepath: string): Promise<boolean> {
    try {
      await fs.unlink(filepath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(filepath: string): Promise<boolean> {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Move file from temp to permanent location
   */
  static async moveFile(sourcePath: string, destinationPath: string): Promise<boolean> {
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(destinationPath);
      await fs.mkdir(destDir, { recursive: true });
      
      // Move file
      await fs.rename(sourcePath, destinationPath);
      return true;
    } catch (error) {
      console.error('Error moving file:', error);
      return false;
    }
  }

  /**
   * Get file stats
   */
  static async getFileStats(filepath: string): Promise<{
    size: number;
    created: Date;
    modified: Date;
  } | null> {
    try {
      const stats = await fs.stat(filepath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      console.error('Error getting file stats:', error);
      return null;
    }
  }

  /**
   * Clean up old temporary files
   */
  static async cleanupTempFiles(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const tempDir = storageConfig.uploadPaths.temp;
      const files = await fs.readdir(tempDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`Cleaned up temp file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  /**
   * Get MIME type from file extension
   */
  static getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename: string): string {
    // Remove path traversal attempts and dangerous characters
    return filename
      .replace(/[<>:"/\\|?*]/g, '') // Remove dangerous characters
      .replace(/\.\./g, '') // Remove path traversal
      .replace(/^\.+/, '') // Remove leading dots
      .trim()
      .substring(0, 255); // Limit length
  }

  /**
   * Generate secure filename
   */
  static generateSecureFilename(originalFilename: string): string {
    const extension = this.getFileExtension(originalFilename);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    
    return `${timestamp}_${random}${extension}`;
  }
}

// Document category mapping
export const documentCategoryConfig = {
  identity: {
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSize: 5 * 1024 * 1024, // 5MB
    description: 'Identity documents (ID, passport, etc.)'
  },
  financial: {
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Financial documents (bank statements, tax returns, etc.)'
  },
  property: {
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Property documents (deeds, inspections, etc.)'
  },
  transaction: {
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Transaction documents (contracts, agreements, etc.)'
  },
  other: {
    allowedTypes: storageConfig.allowedMimeTypes,
    maxSize: storageConfig.maxFileSize,
    description: 'Other documents'
  }
};

// Initialize storage on module load
StorageUtils.ensureDirectoriesExist().catch(console.error);

export default storageConfig;