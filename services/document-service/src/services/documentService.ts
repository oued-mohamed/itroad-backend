// services/document-service/src/services/documentService.ts
import { DocumentModel, CreateDocumentInput, UpdateDocumentInput } from '../models/Document';
import { FileHelper } from '../utils/fileHelper';
import { logger } from '../utils/logger';
import path from 'path';

export interface DocumentResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class DocumentService {
  static async uploadDocuments(adherantId: string, files: Express.Multer.File[], metadata: any): Promise<DocumentResponse> {
    try {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3003';
      const uploadedDocuments = [];

      for (const file of files) {
        const documentData: CreateDocumentInput = {
          adherantId,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          url: FileHelper.getFileUrl(file.filename, baseUrl),
          description: metadata.description,
          category: metadata.category,
          isPublic: metadata.isPublic === 'true',
          tags: metadata.tags ? JSON.parse(metadata.tags) : []
        };

        const document = await DocumentModel.create(documentData);
        uploadedDocuments.push(document);
      }

      return {
        success: true,
        message: `${uploadedDocuments.length} document(s) uploaded successfully`,
        data: uploadedDocuments
      };
    } catch (error) {
      logger.error('Upload documents error:', error);
      
      // Clean up uploaded files on error
      for (const file of files) {
        await FileHelper.deleteFile(file.path);
      }
      
      return {
        success: false,
        message: 'Failed to upload documents'
      };
    }
  }

  static async getDocuments(adherantId: string, page: number = 1, limit: number = 10): Promise<DocumentResponse> {
    try {
      const result = await DocumentModel.findByAdherantId(adherantId, page, limit);
      
      return {
        success: true,
        message: 'Documents retrieved successfully',
        data: {
          documents: result.documents,
          pagination: {
            page,
            limit,
            total: result.total,
            pages: Math.ceil(result.total / limit)
          }
        }
      };
    } catch (error) {
      logger.error('Get documents error:', error);
      return {
        success: false,
        message: 'Failed to retrieve documents'
      };
    }
  }

  static async getDocument(id: string, adherantId: string): Promise<DocumentResponse> {
    try {
      const document = await DocumentModel.findById(id, adherantId);
      
      if (!document) {
        return {
          success: false,
          message: 'Document not found'
        };
      }

      return {
        success: true,
        message: 'Document retrieved successfully',
        data: document
      };
    } catch (error) {
      logger.error('Get document error:', error);
      return {
        success: false,
        message: 'Failed to retrieve document'
      };
    }
  }

  static async updateDocument(id: string, adherantId: string, updates: UpdateDocumentInput): Promise<DocumentResponse> {
    try {
      const document = await DocumentModel.update(id, adherantId, updates);
      
      if (!document) {
        return {
          success: false,
          message: 'Document not found'
        };
      }

      return {
        success: true,
        message: 'Document updated successfully',
        data: document
      };
    } catch (error) {
      logger.error('Update document error:', error);
      return {
        success: false,
        message: 'Failed to update document'
      };
    }
  }

  static async deleteDocument(id: string, adherantId: string): Promise<DocumentResponse> {
    try {
      const document = await DocumentModel.delete(id, adherantId);
      
      if (!document) {
        return {
          success: false,
          message: 'Document not found'
        };
      }

      // Delete physical file
      const filename = FileHelper.extractFilename(document.url);
      if (filename) {
        const filePath = path.join(process.cwd(), 'uploads/documents', filename);
        await FileHelper.deleteFile(filePath);
      }

      return {
        success: true,
        message: 'Document deleted successfully'
      };
    } catch (error) {
      logger.error('Delete document error:', error);
      return {
        success: false,
        message: 'Failed to delete document'
      };
    }
  }

  static async getDocumentsByCategory(adherantId: string, category: string): Promise<DocumentResponse> {
    try {
      const documents = await DocumentModel.findByCategory(adherantId, category);
      
      return {
        success: true,
        message: 'Documents retrieved successfully',
        data: documents
      };
    } catch (error) {
      logger.error('Get documents by category error:', error);
      return {
        success: false,
        message: 'Failed to retrieve documents'
      };
    }
  }

  static async searchDocuments(adherantId: string, searchTerm: string): Promise<DocumentResponse> {
    try {
      const documents = await DocumentModel.searchDocuments(adherantId, searchTerm);
      
      return {
        success: true,
        message: 'Search completed successfully',
        data: documents
      };
    } catch (error) {
      logger.error('Search documents error:', error);
      return {
        success: false,
        message: 'Failed to search documents'
      };
    }
  }

  static async getDocumentStats(adherantId: string): Promise<DocumentResponse> {
    try {
      const allDocuments = await DocumentModel.findByAdherantId(adherantId, 1, 1000);
      const documents = allDocuments.documents;
      
      const stats = {
        total: documents.length,
        totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
        categories: {} as Record<string, number>,
        fileTypes: {} as Record<string, number>,
        recentUploads: documents.slice(0, 5)
      };

      // Calculate category distribution
      documents.forEach(doc => {
        stats.categories[doc.category] = (stats.categories[doc.category] || 0) + 1;
      });

      // Calculate file type distribution
      documents.forEach(doc => {
        const extension = FileHelper.getFileExtension(doc.originalName) || 'unknown';
        stats.fileTypes[extension] = (stats.fileTypes[extension] || 0) + 1;
      });

      return {
        success: true,
        message: 'Statistics retrieved successfully',
        data: stats
      };
    } catch (error) {
      logger.error('Get document stats error:', error);
      return {
        success: false,
        message: 'Failed to retrieve statistics'
      };
    }
  }
}

