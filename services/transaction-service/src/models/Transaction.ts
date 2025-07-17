// services/transaction-service/src/models/Transaction.ts
import { pool } from '../config/database';
// Import types from shared - using relative path since @shared mapping might not work in all contexts
import { 
  Transaction, 
  TransactionType, 
  TransactionStatus, 
  TransactionMilestone 
} from '../../../../shared/types/transaction';

// Define FinancingDetails locally since it's not exported from shared types
export interface FinancingDetails {
  loanAmount: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  lenderName?: string;
  preApproved: boolean;
}

// Create a type for transaction creation that includes all needed properties
export interface CreateTransactionData {
  propertyId: string;
  buyerId: string;
  sellerId: string;
  agentId: string;
  clientId: string;
  type: TransactionType;
  status: TransactionStatus;
  price: number;
  currency: string;
  commission: number;
  commissionRate: number;
  deposit: number;
  closingDate: Date;
  contractDate: Date;
  inspectionDate?: Date;
  financingDetails?: FinancingDetails;
  documents: string[];
  notes?: string;
  milestones: TransactionMilestone[];
  commissionType: string;
  isActive: boolean;
}

// Create a complete Transaction interface for this service
export interface ServiceTransaction {
  id: string;
  propertyId: string;
  buyerId: string;
  sellerId: string;
  agentId: string;
  clientId: string;
  type: TransactionType;
  status: TransactionStatus;
  price: number;
  currency: string;
  commission: number;
  commissionRate: number;
  deposit: number;
  closingDate: Date;
  contractDate: Date;
  inspectionDate?: Date;
  financingDetails?: FinancingDetails;
  documents: string[];
  notes?: string;
  milestones: TransactionMilestone[];
  commissionType: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class TransactionModel {
  static async findByPropertyId(propertyId: string): Promise<ServiceTransaction[]> {
    const query = `
      SELECT id, property_id as "propertyId", buyer_id as "buyerId", seller_id as "sellerId",
             agent_id as "agentId", client_id as "clientId", type, status, price, currency, 
             commission, commission_rate as "commissionRate", deposit, closing_date as "closingDate", 
             contract_date as "contractDate", inspection_date as "inspectionDate", 
             financing_details as "financingDetails", documents, notes, milestones,
             commission_type as "commissionType", is_active as "isActive",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM transactions 
      WHERE property_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [propertyId]);
    
    return result.rows.map(row => ({
      ...row,
      financingDetails: row.financingDetails ? JSON.parse(row.financingDetails) : null,
      documents: JSON.parse(row.documents || '[]'),
      milestones: JSON.parse(row.milestones || '[]')
    }));
  }

  static async findAll(limit: number, offset: number): Promise<ServiceTransaction[]> {
    const query = `
      SELECT id, property_id as "propertyId", buyer_id as "buyerId", seller_id as "sellerId",
             agent_id as "agentId", client_id as "clientId", type, status, price, currency, 
             commission, commission_rate as "commissionRate", deposit, closing_date as "closingDate", 
             contract_date as "contractDate", inspection_date as "inspectionDate", 
             financing_details as "financingDetails", documents, notes, milestones,
             commission_type as "commissionType", is_active as "isActive",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM transactions
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);
    
    return result.rows.map(row => ({
      ...row,
      financingDetails: row.financingDetails ? JSON.parse(row.financingDetails) : null,
      documents: JSON.parse(row.documents || '[]'),
      milestones: JSON.parse(row.milestones || '[]')
    }));
  }

  static async updateStatus(id: string, status: string, agentId?: string): Promise<void> {
    const query = `
      UPDATE transactions 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    await pool.query(query, [status, id]);
  }

  static async getStats(agentId?: string): Promise<any> {
    return await this.getTransactionStats(agentId);
  }

  static async create(transactionData: CreateTransactionData): Promise<ServiceTransaction> {
    const query = `
      INSERT INTO transactions (
        property_id, buyer_id, seller_id, agent_id, client_id, type, status, price, currency,
        commission, commission_rate, deposit, closing_date, contract_date, inspection_date,
        financing_details, documents, notes, milestones, commission_type, is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      )
      RETURNING id, property_id as "propertyId", buyer_id as "buyerId", seller_id as "sellerId",
                agent_id as "agentId", client_id as "clientId", type, status, price, currency, 
                commission, commission_rate as "commissionRate", deposit, closing_date as "closingDate", 
                contract_date as "contractDate", inspection_date as "inspectionDate", 
                financing_details as "financingDetails", documents, notes, milestones, 
                commission_type as "commissionType", is_active as "isActive",
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const values = [
      transactionData.propertyId,
      transactionData.buyerId,
      transactionData.sellerId,
      transactionData.agentId,
      transactionData.clientId,
      transactionData.type,
      transactionData.status,
      transactionData.price,
      transactionData.currency,
      transactionData.commission,
      transactionData.commissionRate,
      transactionData.deposit,
      transactionData.closingDate,
      transactionData.contractDate,
      transactionData.inspectionDate,
      JSON.stringify(transactionData.financingDetails),
      JSON.stringify(transactionData.documents),
      transactionData.notes,
      JSON.stringify(transactionData.milestones),
      transactionData.commissionType,
      transactionData.isActive
    ];

    const result = await pool.query(query, values);
    const transaction = result.rows[0];
    
    return {
      ...transaction,
      financingDetails: transaction.financingDetails ? JSON.parse(transaction.financingDetails) : null,
      documents: JSON.parse(transaction.documents || '[]'),
      milestones: JSON.parse(transaction.milestones || '[]')
    };
  }

  static async findById(id: string): Promise<ServiceTransaction | null> {
    const query = `
      SELECT id, property_id as "propertyId", buyer_id as "buyerId", seller_id as "sellerId",
             agent_id as "agentId", client_id as "clientId", type, status, price, currency, 
             commission, commission_rate as "commissionRate", deposit, closing_date as "closingDate", 
             contract_date as "contractDate", inspection_date as "inspectionDate", 
             financing_details as "financingDetails", documents, notes, milestones,
             commission_type as "commissionType", is_active as "isActive",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM transactions WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;

    const transaction = result.rows[0];
    return {
      ...transaction,
      financingDetails: transaction.financingDetails ? JSON.parse(transaction.financingDetails) : null,
      documents: JSON.parse(transaction.documents || '[]'),
      milestones: JSON.parse(transaction.milestones || '[]')
    };
  }

  static async findByAgentId(agentId: string, limit: number, offset: number): Promise<{
    transactions: ServiceTransaction[];
    total: number;
    pagination: any;
  }> {
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM transactions WHERE agent_id = $1`;
    const countResult = await pool.query(countQuery, [agentId]);
    const total = parseInt(countResult.rows[0].count);

    // Get transactions
    const query = `
      SELECT id, property_id as "propertyId", buyer_id as "buyerId", seller_id as "sellerId",
             agent_id as "agentId", client_id as "clientId", type, status, price, currency, 
             commission, commission_rate as "commissionRate", deposit, closing_date as "closingDate", 
             contract_date as "contractDate", inspection_date as "inspectionDate", 
             financing_details as "financingDetails", documents, notes, milestones,
             commission_type as "commissionType", is_active as "isActive",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM transactions 
      WHERE agent_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [agentId, limit, offset]);
    
    const transactions = result.rows.map(row => ({
      ...row,
      financingDetails: row.financingDetails ? JSON.parse(row.financingDetails) : null,
      documents: JSON.parse(row.documents || '[]'),
      milestones: JSON.parse(row.milestones || '[]')
    }));

    const page = Math.floor(offset / limit) + 1;

    return {
      transactions,
      total,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async update(id: string, updates: Partial<ServiceTransaction>): Promise<ServiceTransaction | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'createdAt') {
        const dbField = this.getDbFieldName(key);
        
        if (key === 'financingDetails' || key === 'documents' || key === 'milestones') {
          fields.push(`${dbField} = $${paramIndex++}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${dbField} = $${paramIndex++}`);
          values.push(value);
        }
      }
    });

    if (fields.length === 0) return null;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `
      UPDATE transactions
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, property_id as "propertyId", buyer_id as "buyerId", seller_id as "sellerId",
                agent_id as "agentId", client_id as "clientId", type, status, price, currency, 
                commission, commission_rate as "commissionRate", deposit, closing_date as "closingDate", 
                contract_date as "contractDate", inspection_date as "inspectionDate", 
                financing_details as "financingDetails", documents, notes, milestones,
                commission_type as "commissionType", is_active as "isActive",
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return null;

    const transaction = result.rows[0];
    return {
      ...transaction,
      financingDetails: transaction.financingDetails ? JSON.parse(transaction.financingDetails) : null,
      documents: JSON.parse(transaction.documents || '[]'),
      milestones: JSON.parse(transaction.milestones || '[]')
    };
  }

  static async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM transactions WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async findByStatus(status: TransactionStatus, agentId?: string): Promise<ServiceTransaction[]> {
    let query = `
      SELECT id, property_id as "propertyId", buyer_id as "buyerId", seller_id as "sellerId",
             agent_id as "agentId", client_id as "clientId", type, status, price, currency, 
             commission, commission_rate as "commissionRate", deposit, closing_date as "closingDate", 
             contract_date as "contractDate", inspection_date as "inspectionDate", 
             financing_details as "financingDetails", documents, notes, milestones,
             commission_type as "commissionType", is_active as "isActive",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM transactions WHERE status = $1
    `;
    
    const params: any[] = [status];
    
    if (agentId) {
      query += ` AND agent_id = $2`;
      params.push(agentId);
    }
    
    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    
    return result.rows.map(row => ({
      ...row,
      financingDetails: row.financingDetails ? JSON.parse(row.financingDetails) : null,
      documents: JSON.parse(row.documents || '[]'),
      milestones: JSON.parse(row.milestones || '[]')
    }));
  }

  static async getTransactionStats(agentId?: string): Promise<{
    totalTransactions: number;
    totalVolume: number;
    totalCommission: number;
    byStatus: { [key in TransactionStatus]: number };
    byType: { [key in TransactionType]: number };
    averagePrice: number;
    averageCommission: number;
  }> {
    let baseQuery = `FROM transactions`;
    let whereClause = '';
    const params: any[] = [];

    if (agentId) {
      whereClause = ' WHERE agent_id = $1';
      params.push(agentId);
    }

    // Get overall stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(price), 0) as total_volume,
        COALESCE(SUM(commission), 0) as total_commission,
        COALESCE(AVG(price), 0) as average_price,
        COALESCE(AVG(commission), 0) as average_commission
      ${baseQuery}${whereClause}
    `;

    const statsResult = await pool.query(statsQuery, params);
    const stats = statsResult.rows[0];

    // Get by status
    const statusQuery = `
      SELECT status, COUNT(*) as count
      ${baseQuery}${whereClause}
      GROUP BY status
    `;

    const statusResult = await pool.query(statusQuery, params);
    const byStatus = statusResult.rows.reduce((acc: any, row: any) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});

    // Get by type
    const typeQuery = `
      SELECT type, COUNT(*) as count
      ${baseQuery}${whereClause}
      GROUP BY type
    `;

    const typeResult = await pool.query(typeQuery, params);
    const byType = typeResult.rows.reduce((acc: any, row: any) => {
      acc[row.type] = parseInt(row.count);
      return acc;
    }, {});

    return {
      totalTransactions: parseInt(stats.total_transactions),
      totalVolume: parseFloat(stats.total_volume),
      totalCommission: parseFloat(stats.total_commission),
      byStatus,
      byType,
      averagePrice: parseFloat(stats.average_price),
      averageCommission: parseFloat(stats.average_commission)
    };
  }

  private static getDbFieldName(field: string): string {
    const fieldMap: Record<string, string> = {
      propertyId: 'property_id',
      buyerId: 'buyer_id',
      sellerId: 'seller_id',
      agentId: 'agent_id',
      clientId: 'client_id',
      commissionRate: 'commission_rate',
      closingDate: 'closing_date',
      contractDate: 'contract_date',
      inspectionDate: 'inspection_date',
      financingDetails: 'financing_details',
      commissionType: 'commission_type',
      isActive: 'is_active',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
    
    return fieldMap[field] || field;
  }
}