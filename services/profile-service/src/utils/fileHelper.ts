// services/profile-service/src/utils/fileHelper.ts
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
    return `${baseUrl}/uploads/avatars/${filename}`;
  }

  static extractFilename(url: string): string | null {
    const matches = url.match(/\/uploads\/avatars\/(.+)$/);
    return matches ? matches[1] : null;
  }
}

