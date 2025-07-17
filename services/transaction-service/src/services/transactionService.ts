// services/transaction-service/src/services/transactionService.ts
import { TransactionModel } from '../models/Transaction';
import { Transaction, CreateTransactionData, UpdateTransactionData, TransactionStatus } from '../../../../shared/types/transaction';
import { logger } from '../utils/logger';   

export class TransactionService {
  static async createTransaction(agentId: string, transactionData: CreateTransactionData): Promise<Transaction> {
    try {
      const transaction = await TransactionModel.create({
        ...transactionData,
        agentId,
        commission: transactionData.commission ?? 0,
        commissionRate: 0,
        deposit: 0,
        documents: [],
        milestones: [],
        status: transactionData.status ?? TransactionStatus.PENDING,
        propertyId: transactionData.propertyId,
        buyerId: transactionData.buyerId ?? '',
        sellerId: transactionData.sellerId ?? '',
        type: transactionData.type,
        price: transactionData.price,
        currency: transactionData.currency ?? 'USD',
        closingDate: transactionData.closingDate ?? new Date(),
        contractDate: transactionData.contractDate ?? new Date(),
        inspectionDate: transactionData.inspectionDate ?? undefined,
        notes: transactionData.notes ?? '',
        clientId: transactionData.clientId ?? '', // Ensure clientId is set
        commissionType: transactionData.commissionType ?? '', // Ensure commissionType is set
        isActive: true // Set isActive to true by default
      });
      
      // Log transaction creation for audit
      logger.info('Transaction created in service', {
        transactionId: transaction.id,
        agentId,
        propertyId: transaction.propertyId,
        type: transaction.type,
        price: transaction.price
      });

      // Ensure all required properties are present in the returned object
      return {
        ...transaction,
        clientId: transaction.clientId ?? transactionData.clientId ?? '',
        commission: transaction.commission ?? transactionData.commission ?? 0,
        commissionAmount: transaction.commissionRate ?? 0
      };
    } catch (error) {
      logger.error('Error creating transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        agentId,
        propertyId: transactionData.propertyId
      });
      throw error;
    }
  }

  static async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      return await TransactionModel.findById(id);
    } catch (error) {
      logger.error('Error fetching transaction by ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: id
      });
      throw error;
    }
  }

  static async getTransactionsByAgent(agentId: string, limit: number, offset: number): Promise<{ transactions: Transaction[]; total: number; pagination: any }> {
    try {
      return await TransactionModel.findByAgentId(agentId, limit, offset);
    } catch (error) {
      logger.error('Error fetching transactions by agent', {
        error: error instanceof Error ? error.message : 'Unknown error',
        agentId,
        limit,
        offset
      });
      throw error;
    }
  }

  static async getTransactionsByClient(clientId: string, limit: number, offset: number): Promise<Transaction[]> {
    try {
      return await TransactionModel.findByAgentId(clientId, limit, offset);
    } catch (error) {
      logger.error('Error fetching transactions by client', {
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId,
        limit,
        offset
      });
      throw error;
    }
  }

  static async getTransactionsByProperty(propertyId: string): Promise<Transaction[]> {
    try {
      return await TransactionModel.findByPropertyId(propertyId);
    } catch (error) {
      logger.error('Error fetching transactions by property', {
        error: error instanceof Error ? error.message : 'Unknown error',
        propertyId
      });
      throw error;
    }
  }

  static async getAllTransactions(limit: number, offset: number): Promise<Transaction[]> {
    try {
      return await TransactionModel.findAll(limit, offset);
    } catch (error) {
      logger.error('Error fetching all transactions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        limit,
        offset
      });
      throw error;
    }
  }

  static async updateTransaction(id: string, agentId: string, updateData: UpdateTransactionData): Promise<Transaction | null> {
    try {
      const updatedTransaction = await TransactionModel.update(id, updateData);
      
      if (updatedTransaction) {
        logger.info('Transaction updated in service', {
          transactionId: id,
          agentId,
          updatedFields: Object.keys(updateData)
        });
      }

      return updatedTransaction;
    } catch (error) {
      logger.error('Error updating transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: id,
        agentId
      });
      throw error;
    }
  }

  static async updateTransactionStatus(id: string, status: string, agentId?: string): Promise<Transaction | null> {
    try {
      await TransactionModel.updateStatus(id, status, agentId);

      logger.info('Transaction status updated in service', {
        transactionId: id,
        newStatus: status,
        updatedBy: agentId || 'system'
      });

      // If you need to return the updated transaction, fetch it again
      return await TransactionModel.findById(id);
    } catch (error) {
      logger.error('Error updating transaction status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: id,
        status,
        agentId
      });
      throw error;
    }
  }

  static async deleteTransaction(id: string, agentId: string): Promise<boolean> {
    try {
      const deleted = await TransactionModel.delete(id);
      
      if (deleted) {
        logger.info('Transaction deleted in service', {
          transactionId: id,
          agentId
        });
      }

      return deleted;
    } catch (error) {
      logger.error('Error deleting transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: id,
        agentId
      });
      throw error;
    }
  }

  static async getTransactionStats(agentId?: string): Promise<any> {
    try {
      return await TransactionModel.getStats(agentId);
    } catch (error) {
      logger.error('Error fetching transaction stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
        agentId
      });
      throw error;
    }
  }

  static async getTransactionTimeline(transactionId: string): Promise<any[]> {
    try {
      // This would typically fetch from a transaction_timeline table
      // For now, returning empty array as placeholder
      logger.info('Fetching transaction timeline', { transactionId });
      return [];
    } catch (error) {
      logger.error('Error fetching transaction timeline', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId
      });
      throw error;
    }
  }
}

