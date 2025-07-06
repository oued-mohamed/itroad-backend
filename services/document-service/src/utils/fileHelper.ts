// services/document-service/src/utils/fileHelper.ts
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger';

export class FileHelper {
  static async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.info(`File deleted: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to delete file: ${filePath}`, error);
    }
  }

  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
      logger.info(`Directory created: ${dirPath}`);
    }
  }

  static getFileUrl(filename: string, baseUrl: string): string {
    return `${baseUrl}/uploads/documents/${filename}`;
  }

  static extractFilename(url: string): string | null {
    const matches = url.match(/\/uploads\/documents\/(.+)$/);
    return matches ? matches[1] : null;
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  static isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  static isPdfFile(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }
}

