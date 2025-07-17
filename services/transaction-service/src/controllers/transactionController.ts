// services/transaction-service/src/controllers/transactionController.ts
import { Request, Response } from 'express';
import { TransactionModel } from '../models/Transaction';
import { TransactionService } from '../services/transactionService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '@/utils/logger';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export class TransactionController {
  static getTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId, role } = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    let result;
    if (role === 'admin') {
      // Admin can see all transactions
      result = await TransactionService.getAllTransactions(page, limit);
    } else {
      // Agents see only their transactions
      result = await TransactionModel.findByAgentId(userId, page, limit);
    }

    res.json({
      success: true,
      data: Array.isArray(result) ? result : result.transactions,
      pagination: (result as any).pagination
    });
  });

  static getTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const transaction = await TransactionModel.findById(id);
    if (!transaction) {
      throw createError('Transaction not found', 404);
    }

    // Check permissions
    if (role !== 'admin' && transaction.agentId !== userId) {
      throw createError('Access denied', 403);
    }

    res.json({
      success: true,
      data: transaction
    });
  });

  static createTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId, role } = req.user!;

    if (role !== 'agent' && role !== 'admin') {
      throw createError('Only agents can create transactions', 403);
    }

    const transactionData = {
      ...req.body,
      agentId: userId,
      status: 'pending',
      documents: req.body.documents || [],
      milestones: req.body.milestones || []
    };

    const transaction = await TransactionModel.create(transactionData);

    logger.info('Transaction created', { transactionId: transaction.id, agentId: userId });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  });

  static updateTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const existingTransaction = await TransactionModel.findById(id);
    if (!existingTransaction) {
      throw createError('Transaction not found', 404);
    }

    // Check permissions
    if (role !== 'admin' && existingTransaction.agentId !== userId) {
      throw createError('Access denied', 403);
    }

    const transaction = await TransactionModel.update(id, req.body);
    if (!transaction) {
      throw createError('Transaction update failed', 400);
    }

    logger.info('Transaction updated', { transactionId: id, agentId: userId });

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  });

  static deleteTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const existingTransaction = await TransactionModel.findById(id);
    if (!existingTransaction) {
      throw createError('Transaction not found', 404);
    }

    // Check permissions
    if (role !== 'admin' && existingTransaction.agentId !== userId) {
      throw createError('Access denied', 403);
    }

    const deleted = await TransactionModel.delete(id);
    if (!deleted) {
      throw createError('Transaction deletion failed', 400);
    }

    logger.info('Transaction deleted', { transactionId: id, agentId: userId });

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  });

  static getTransactionStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId, role } = req.user!;

    const agentId = role === 'admin' ? undefined : userId;
    const stats = await TransactionModel.getTransactionStats(agentId);

    res.json({
      success: true,
      data: stats
    });
  });

  static updateTransactionStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const { userId, role } = req.user!;

    const existingTransaction = await TransactionModel.findById(id);
    if (!existingTransaction) {
      throw createError('Transaction not found', 404);
    }

    // Check permissions
    if (role !== 'admin' && existingTransaction.agentId !== userId) {
      throw createError('Access denied', 403);
    }

    const transaction = await TransactionModel.update(id, { status });
    if (!transaction) {
      throw createError('Status update failed', 400);
    }

    logger.info('Transaction status updated', { 
      transactionId: id, 
      status, 
      agentId: userId 
    });

    res.json({
      success: true,
      message: 'Transaction status updated successfully',
      data: transaction
    });
  });

  static getTransactionsByStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status } = req.params;
    const { userId, role } = req.user!;

    const agentId = role === 'admin' ? undefined : userId;
    const transactions = await TransactionModel.findByStatus(status as any, agentId);

    res.json({
      success: true,
      data: transactions
    });
  });
}

