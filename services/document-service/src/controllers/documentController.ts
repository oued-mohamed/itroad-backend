// services/document-service/src/controllers/documentController.ts
import { Response } from 'express';
import { DocumentService } from '../services/documentService';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

export class DocumentController {
  static uploadDocuments = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'No files provided'
      });
    }

    const files = Array.isArray(req.files) ? req.files : [req.files as Express.Multer.File];
    const result = await DocumentService.uploadDocuments(req.user!.adherantId, files, req.body);
    
    const statusCode = result.success ? 201 : 400;
    res.status(statusCode).json(result);
  });

  static getDocuments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await DocumentService.getDocuments(req.user!.adherantId, page, limit);
    res.json(result);
  });

  static getDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await DocumentService.getDocument(req.params.id, req.user!.adherantId);
    
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  });

  static updateDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await DocumentService.updateDocument(req.params.id, req.user!.adherantId, req.body);
    
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  });

  static deleteDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await DocumentService.deleteDocument(req.params.id, req.user!.adherantId);
    
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  });

  static getDocumentsByCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { category } = req.params;
    const result = await DocumentService.getDocumentsByCategory(req.user!.adherantId, category);
    
    res.json(result);
  });

  static searchDocuments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const searchTerm = req.query.q as string;
    const result = await DocumentService.searchDocuments(req.user!.adherantId, searchTerm);
    
    res.json(result);
  });

  static getDocumentStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await DocumentService.getDocumentStats(req.user!.adherantId);
    
    res.json(result);
  });

  static downloadDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await DocumentService.getDocument(req.params.id, req.user!.adherantId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    const document = result.data;
    res.download(document.path, document.originalName);
  });
}

