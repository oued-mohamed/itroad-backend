// shared/types/transaction.ts
export interface Transaction {
  id: string;
  propertyId: string;
  agentId: string;
  clientId: string;
  buyerId?: string;
  sellerId?: string;
  type: TransactionType;
  status: TransactionStatus;
  price: number;
  currency: string;
  commission: number;
  commissionType: 'percentage' | 'fixed';
  commissionAmount: number;
  notes?: string;
  contractDate?: Date;
  closingDate?: Date;
  inspectionDate?: Date;
  appraisalValue?: number;
  financingType?: string;
  downPayment?: number;
  loanAmount?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Related data (populated when needed)
  property?: {
    title: string;
    address: string;
    city: string;
    state: string;
    type: string;
    primaryImage?: string;
  };
  agent?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  client?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  buyer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  seller?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export interface CreateTransactionData {
  propertyId: string;
  clientId: string;
  buyerId?: string;
  sellerId?: string;
  type: TransactionType;
  status?: TransactionStatus;
  price: number;
  currency?: string;
  commission: number;
  commissionType?: 'percentage' | 'fixed';
  notes?: string;
  contractDate?: Date;
  closingDate?: Date;
  inspectionDate?: Date;
  financingType?: string;
  downPayment?: number;
  loanAmount?: number;
}

export interface UpdateTransactionData extends Partial<CreateTransactionData> {
  status?: TransactionStatus;
  appraisalValue?: number;
  notes?: string;
}

export interface TransactionDocument {
  id: string;
  transactionId: string;
  documentId: string;
  documentType: TransactionDocumentType;
  title: string;
  filename: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  isRequired: boolean;
  status: DocumentStatus;
}

export interface TransactionTimeline {
  id: string;
  transactionId: string;
  eventType: TransactionEventType;
  title: string;
  description: string;
  status: TransactionStatus;
  performedBy: string;
  performedAt: Date;
  metadata?: {
    oldValue?: any;
    newValue?: any;
    documents?: string[];
    notes?: string;
  };
}

export interface TransactionMilestone {
  id: string;
  transactionId: string;
  milestone: TransactionStatus;
  title: string;
  description: string;
  targetDate?: Date;
  completedDate?: Date;
  isCompleted: boolean;
  isRequired: boolean;
  order: number;
  dependencies?: string[]; // Milestone IDs
}

export interface TransactionStats {
  total: number;
  active: number;
  closed: number;
  cancelled: number;
  totalVolume: number;
  totalCommission: number;
  avgDaysToClose: number;
  avgTransactionValue: number;
  byType: { [key in TransactionType]?: number };
  byStatus: { [key in TransactionStatus]?: number };
  monthlyStats: {
    month: string;
    transactions: number;
    volume: number;
    commission: number;
  }[];
  recentActivity: {
    newTransactions: number;
    statusChanges: number;
    closings: number;
  };
}

export interface TransactionPerformance {
  agentId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalTransactions: number;
    closedDeals: number;
    totalVolume: number;
    totalCommission: number;
    avgDaysToClose: number;
    conversionRate: number;
    avgDealSize: number;
  };
  trends: {
    volumeTrend: number; // % change from previous period
    transactionTrend: number;
    commissionTrend: number;
  };
  topProperties: {
    propertyId: string;
    propertyTitle: string;
    price: number;
    commission: number;
    daysToClose: number;
  }[];
}

export interface TransactionFilters {
  agentId?: string;
  clientId?: string;
  propertyId?: string;
  type?: TransactionType;
  status?: TransactionStatus[];
  minPrice?: number;
  maxPrice?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  city?: string;
  state?: string;
  sortBy?: TransactionSortOption;
  sortOrder?: 'asc' | 'desc';
}

export interface TransactionWorkflow {
  id: string;
  transactionType: TransactionType;
  name: string;
  description: string;
  steps: TransactionWorkflowStep[];
  isDefault: boolean;
  isActive: boolean;
}

export interface TransactionWorkflowStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  requiredStatus: TransactionStatus;
  estimatedDays: number;
  isRequired: boolean;
  requiresDocuments: boolean;
  requiredDocuments: TransactionDocumentType[];
  actions: TransactionAction[];
  notifications: NotificationTrigger[];
}

export interface TransactionAction {
  id: string;
  type: 'email' | 'task' | 'reminder' | 'document_request';
  title: string;
  description: string;
  assignedTo: 'agent' | 'client' | 'buyer' | 'seller' | 'system';
  dueDate?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: string;
}

export interface NotificationTrigger {
  type: 'email' | 'sms' | 'push' | 'in_app';
  recipients: ('agent' | 'client' | 'buyer' | 'seller')[];
  template: string;
  timing: 'immediate' | 'scheduled' | 'reminder';
  delay?: number; // hours
}

// Enums and Types
export enum TransactionType {
  SALE = 'sale',
  RENTAL = 'rental',
  LEASE = 'lease'
}

export enum TransactionStatus {
  INQUIRY = 'inquiry',
  VIEWING_SCHEDULED = 'viewing_scheduled',
  OFFER_MADE = 'offer_made',
  OFFER_ACCEPTED = 'offer_accepted',
  UNDER_CONTRACT = 'under_contract',
  INSPECTION_PENDING = 'inspection_pending',
  INSPECTION_COMPLETED = 'inspection_completed',
  FINANCING_PENDING = 'financing_pending',
  FINANCING_APPROVED = 'financing_approved',
  APPRAISAL_PENDING = 'appraisal_pending',
  APPRAISAL_COMPLETED = 'appraisal_completed',
  CLOSING_SCHEDULED = 'closing_scheduled',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
  PENDING = "PENDING"
}

export enum TransactionEventType {
  CREATED = 'created',
  STATUS_CHANGED = 'status_changed',
  PRICE_UPDATED = 'price_updated',
  DOCUMENT_UPLOADED = 'document_uploaded',
  DOCUMENT_APPROVED = 'document_approved',
  INSPECTION_SCHEDULED = 'inspection_scheduled',
  INSPECTION_COMPLETED = 'inspection_completed',
  APPRAISAL_COMPLETED = 'appraisal_completed',
  FINANCING_APPROVED = 'financing_approved',
  CLOSING_SCHEDULED = 'closing_scheduled',
  COMMISSION_CALCULATED = 'commission_calculated',
  NOTE_ADDED = 'note_added',
  REMINDER_SENT = 'reminder_sent'
}

export enum TransactionDocumentType {
  // Purchase Documents
  PURCHASE_AGREEMENT = 'purchase_agreement',
  OFFER_LETTER = 'offer_letter',
  COUNTER_OFFER = 'counter_offer',
  ADDENDUM = 'addendum',
  
  // Financial Documents
  PRE_APPROVAL_LETTER = 'pre_approval_letter',
  LOAN_APPLICATION = 'loan_application',
  BANK_STATEMENT = 'bank_statement',
  TAX_RETURN = 'tax_return',
  PAY_STUB = 'pay_stub',
  CREDIT_REPORT = 'credit_report',
  
  // Property Documents
  PROPERTY_DISCLOSURE = 'property_disclosure',
  INSPECTION_REPORT = 'inspection_report',
  APPRAISAL_REPORT = 'appraisal_report',
  SURVEY = 'survey',
  TITLE_REPORT = 'title_report',
  DEED = 'deed',
  
  // Closing Documents
  CLOSING_DISCLOSURE = 'closing_disclosure',
  FINAL_WALKTHROUGH = 'final_walkthrough',
  KEYS_RECEIPT = 'keys_receipt',
  WARRANTY_DEED = 'warranty_deed',
  
  // Rental/Lease Documents
  LEASE_AGREEMENT = 'lease_agreement',
  RENTAL_APPLICATION = 'rental_application',
  SECURITY_DEPOSIT_RECEIPT = 'security_deposit_receipt',
  MOVE_IN_INSPECTION = 'move_in_inspection',
  
  // Other
  PHOTO = 'photo',
  VIDEO = 'video',
  OTHER = 'other'
}

export enum DocumentStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum TransactionSortOption {
  NEWEST_FIRST = 'created_desc',
  OLDEST_FIRST = 'created_asc',
  PRICE_HIGH_TO_LOW = 'price_desc',
  PRICE_LOW_TO_HIGH = 'price_asc',
  STATUS_PROGRESS = 'status_progress',
  CLOSING_DATE = 'closing_date_asc',
  COMMISSION_DESC = 'commission_desc'
}

// Constants
export const TRANSACTION_TYPES = [
  { value: TransactionType.SALE, label: 'Sale', icon: '🏠' },
  { value: TransactionType.RENTAL, label: 'Rental', icon: '🔑' },
  { value: TransactionType.LEASE, label: 'Lease', icon: '📋' }
];

export const TRANSACTION_STATUSES = [
  { value: TransactionStatus.INQUIRY, label: 'Inquiry', color: 'blue', progress: 5 },
  { value: TransactionStatus.VIEWING_SCHEDULED, label: 'Viewing Scheduled', color: 'indigo', progress: 10 },
  { value: TransactionStatus.OFFER_MADE, label: 'Offer Made', color: 'purple', progress: 20 },
  { value: TransactionStatus.OFFER_ACCEPTED, label: 'Offer Accepted', color: 'pink', progress: 30 },
  { value: TransactionStatus.UNDER_CONTRACT, label: 'Under Contract', color: 'yellow', progress: 40 },
  { value: TransactionStatus.INSPECTION_PENDING, label: 'Inspection Pending', color: 'orange', progress: 50 },
  { value: TransactionStatus.INSPECTION_COMPLETED, label: 'Inspection Completed', color: 'amber', progress: 60 },
  { value: TransactionStatus.FINANCING_PENDING, label: 'Financing Pending', color: 'lime', progress: 70 },
  { value: TransactionStatus.FINANCING_APPROVED, label: 'Financing Approved', color: 'emerald', progress: 80 },
  { value: TransactionStatus.APPRAISAL_PENDING, label: 'Appraisal Pending', color: 'teal', progress: 85 },
  { value: TransactionStatus.APPRAISAL_COMPLETED, label: 'Appraisal Completed', color: 'cyan', progress: 90 },
  { value: TransactionStatus.CLOSING_SCHEDULED, label: 'Closing Scheduled', color: 'sky', progress: 95 },
  { value: TransactionStatus.CLOSED, label: 'Closed', color: 'green', progress: 100 },
  { value: TransactionStatus.CANCELLED, label: 'Cancelled', color: 'red', progress: 0 },
  { value: TransactionStatus.ON_HOLD, label: 'On Hold', color: 'gray', progress: 0 }
];

export const COMMISSION_TYPES = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount ($)' }
];

export const FINANCING_TYPES = [
  'conventional',
  'fha',
  'va',
  'usda',
  'jumbo',
  'cash',
  'hard_money',
  'owner_financing',
  'other'
];

export const DOCUMENT_CATEGORIES = {
  purchase: {
    label: 'Purchase Documents',
    types: [
      TransactionDocumentType.PURCHASE_AGREEMENT,
      TransactionDocumentType.OFFER_LETTER,
      TransactionDocumentType.COUNTER_OFFER,
      TransactionDocumentType.ADDENDUM
    ]
  },
  financial: {
    label: 'Financial Documents',
    types: [
      TransactionDocumentType.PRE_APPROVAL_LETTER,
      TransactionDocumentType.LOAN_APPLICATION,
      TransactionDocumentType.BANK_STATEMENT,
      TransactionDocumentType.TAX_RETURN,
      TransactionDocumentType.PAY_STUB,
      TransactionDocumentType.CREDIT_REPORT
    ]
  },
  property: {
    label: 'Property Documents',
    types: [
      TransactionDocumentType.PROPERTY_DISCLOSURE,
      TransactionDocumentType.INSPECTION_REPORT,
      TransactionDocumentType.APPRAISAL_REPORT,
      TransactionDocumentType.SURVEY,
      TransactionDocumentType.TITLE_REPORT,
      TransactionDocumentType.DEED
    ]
  },
  closing: {
    label: 'Closing Documents',
    types: [
      TransactionDocumentType.CLOSING_DISCLOSURE,
      TransactionDocumentType.FINAL_WALKTHROUGH,
      TransactionDocumentType.KEYS_RECEIPT,
      TransactionDocumentType.WARRANTY_DEED
    ]
  },
  rental: {
    label: 'Rental/Lease Documents',
    types: [
      TransactionDocumentType.LEASE_AGREEMENT,
      TransactionDocumentType.RENTAL_APPLICATION,
      TransactionDocumentType.SECURITY_DEPOSIT_RECEIPT,
      TransactionDocumentType.MOVE_IN_INSPECTION
    ]
  }
};

// Utility Types
export type TransactionFormData = Omit<CreateTransactionData, 'contractDate' | 'closingDate' | 'inspectionDate'> & {
  contractDate?: string;
  closingDate?: string;
  inspectionDate?: string;
};

export type TransactionListItem = Pick<Transaction,
  'id' | 'type' | 'status' | 'price' | 'currency' | 'commission' | 
  'commissionAmount' | 'contractDate' | 'closingDate' | 'createdAt'
> & {
  propertyTitle: string;
  propertyAddress: string;
  clientName: string;
  agentName: string;
  daysInProgress: number;
  progressPercentage: number;
};

export type TransactionSummary = Pick<Transaction,
  'id' | 'status' | 'price' | 'commission' | 'commissionAmount' | 'closingDate'
> & {
  propertyTitle: string;
  clientName: string;
  daysToClose?: number;
};

// API Response Types
export interface TransactionResponse {
  success: boolean;
  data: Transaction;
  message?: string;
}

export interface TransactionListResponse {
  success: boolean;
  data: TransactionListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters?: TransactionFilters;
}

export interface TransactionStatsResponse {
  success: boolean;
  data: TransactionStats;
}

export interface TransactionPerformanceResponse {
  success: boolean;
  data: TransactionPerformance;
}

export interface TransactionTimelineResponse {
  success: boolean;
  data: TransactionTimeline[];
}

// Helper Functions Types
export interface TransactionCalculations {
  calculateCommission: (price: number, commission: number, type: 'percentage' | 'fixed') => number;
  calculateProgress: (status: TransactionStatus) => number;
  calculateDaysInProgress: (createdAt: Date) => number;
  calculateDaysToClose: (contractDate: Date, closingDate: Date) => number;
  getNextMilestone: (currentStatus: TransactionStatus) => TransactionStatus | null;
  isValidStatusTransition: (from: TransactionStatus, to: TransactionStatus) => boolean;
}