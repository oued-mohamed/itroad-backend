// services/document-service/src/routes/documents.ts 
import { Router } from 'express';
import { DocumentController } from '../controllers/documentController';
import { HealthController } from '../controllers/healthController';
import { authenticateToken } from '../middleware/auth';
import { 
  validateDocumentUpdate, 
  validatePagination, 
  validateDocumentId,
  validateSearch 
} from '../middleware/validation';
import { uploadDocument } from '../middleware/upload';

const router = Router();

// Health check
router.get('/health', HealthController.check);

// Document routes (all require authentication)
router.post('/', 
router.post('/', 
  authenticateToken, 
  uploadDocument.array('documents', 5), 
  DocumentController.uploadDocuments
);
router.get('/', 
  authenticateToken, 
  validatePagination, 
  DocumentController.getDocuments
);

router.get('/stats', 
  authenticateToken, 
  DocumentController.getDocumentStats
);

router.get('/search', 
  authenticateToken, 
  validateSearch, 
  DocumentController.searchDocuments
);

router.get('/category/:category', 
  authenticateToken, 
  DocumentController.getDocumentsByCategory
);

router.get('/:id', 
  authenticateToken, 
  validateDocumentId, 
  DocumentController.getDocument
);

router.get('/:id/download', 
  authenticateToken, 
  validateDocumentId, 
  DocumentController.downloadDocument
);

router.put('/:id', 
  authenticateToken, 
  validateDocumentId, 
  validateDocumentUpdate, 
  DocumentController.updateDocument
);

router.delete('/:id', 
  authenticateToken, 
  validateDocumentId, 
  DocumentController.deleteDocument
);

export default router;

