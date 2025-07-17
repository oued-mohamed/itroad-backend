// services/transaction-service/src/routes/transactions.ts
import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController';
import { authMiddleware } from '../middleware/auth';
import { 
  validateTransaction, 
  validateTransactionUpdate, 
  validateTransactionId,
  validateTransactionStatus,
  validateQueryParams 
} from '../middleware/validation';

const router = Router();

// All transaction routes require authentication
router.use(authMiddleware as import('express').RequestHandler);

// Transaction CRUD operations
router.get('/', ...validateQueryParams, TransactionController.getTransactions);
router.get('/stats', TransactionController.getTransactionStats);
router.get('/:id', validateTransactionId, TransactionController.getTransaction);
router.get('/:id/timeline', validateTransactionId, TransactionController.getTransactionTimeline);
router.post('/', validateTransaction, TransactionController.createTransaction);
router.put('/:id', validateTransactionId, validateTransactionUpdate, TransactionController.updateTransaction);
router.patch('/:id/status', validateTransactionId, validateTransactionStatus, TransactionController.updateTransactionStatus);
router.delete('/:id', ...validateTransactionId, TransactionController.deleteTransaction);

export default router;

