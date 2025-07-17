// services/transaction-service/src/utils/validators.ts
import { CreateTransactionData, UpdateTransactionData } from '../../../../shared/types/transaction';

export const validateTransactionData = (data: CreateTransactionData): string[] => {
  const errors: string[] = [];

  if (!data.propertyId) {
    errors.push('Property ID is required');
  }

  if (!data.clientId) {
    errors.push('Client ID is required');
  }

  if (!data.type) {
    errors.push('Transaction type is required');
  }

  if (!data.price || data.price <= 0) {
    errors.push('Valid price is required');
  }

  if (!data.commission || data.commission < 0) {
    errors.push('Valid commission is required');
  }

  // Validate commission percentage
  if (data.commissionType === 'percentage' && data.commission > 100) {
    errors.push('Commission percentage cannot exceed 100%');
  }

  if (data.commissionType === 'percentage' && data.commission < 0) {
    errors.push('Commission percentage cannot be negative');
  }

  // Validate dates
  if (data.contractDate && data.closingDate) {
    const contractDate = new Date(data.contractDate);
    const closingDate = new Date(data.closingDate);
    
    if (closingDate <= contractDate) {
      errors.push('Closing date must be after contract date');
    }
  }

  // Validate inspection date
  if (data.contractDate && data.inspectionDate) {
    const contractDate = new Date(data.contractDate);
    const inspectionDate = new Date(data.inspectionDate);
    
    if (inspectionDate < contractDate) {
      errors.push('Inspection date cannot be before contract date');
    }
  }

  return errors;
};

export const validateTransactionUpdate = (data: UpdateTransactionData): string[] => {
  const errors: string[] = [];

  if (data.price !== undefined && data.price <= 0) {
    errors.push('Price must be positive');
  }

  if (data.commission !== undefined && data.commission < 0) {
    errors.push('Commission must be non-negative');
  }

  if (data.commissionType === 'percentage' && data.commission !== undefined && data.commission > 100) {
    errors.push('Commission percentage cannot exceed 100%');
  }

  if (data.appraisalValue !== undefined && data.appraisalValue <= 0) {
    errors.push('Appraisal value must be positive');
  }

  if (data.downPayment !== undefined && data.downPayment < 0) {
    errors.push('Down payment must be non-negative');
  }

  if (data.loanAmount !== undefined && data.loanAmount < 0) {
    errors.push('Loan amount must be non-negative');
  }

  return errors;
};

export const validateStatusTransition = (currentStatus: string, newStatus: string): boolean => {
  const validTransitions: { [key: string]: string[] } = {
    'inquiry': ['viewing_scheduled', 'offer_made', 'cancelled', 'on_hold'],
    'viewing_scheduled': ['offer_made', 'cancelled', 'on_hold'],
    'offer_made': ['offer_accepted', 'cancelled', 'on_hold'],
    'offer_accepted': ['under_contract', 'cancelled'],
    'under_contract': ['inspection_pending', 'cancelled'],
    'inspection_pending': ['inspection_completed', 'cancelled', 'on_hold'],
    'inspection_completed': ['financing_pending', 'cancelled'],
    'financing_pending': ['financing_approved', 'cancelled', 'on_hold'],
    'financing_approved': ['appraisal_pending', 'cancelled'],
    'appraisal_pending': ['appraisal_completed', 'cancelled', 'on_hold'],
    'appraisal_completed': ['closing_scheduled', 'cancelled'],
    'closing_scheduled': ['closed', 'cancelled'],
    'closed': [], // Terminal state
    'cancelled': ['inquiry'], // Can restart process
    'on_hold': ['inquiry', 'viewing_scheduled', 'offer_made', 'cancelled']
  };

  const allowedNextStates = validTransitions[currentStatus] || [];
  return allowedNextStates.includes(newStatus);
};

export const calculateCommissionAmount = (
  price: number, 
  commission: number, 
  commissionType: 'percentage' | 'fixed'
): number => {
  if (commissionType === 'percentage') {
    return (price * commission) / 100;
  }
  return commission;
};

export const calculateDaysToClose = (contractDate: Date, closingDate: Date): number => {
  const timeDiff = closingDate.getTime() - contractDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

export const isTransactionActive = (status: string): boolean => {
  const activeStatuses = [
    'inquiry', 'viewing_scheduled', 'offer_made', 'offer_accepted',
    'under_contract', 'inspection_pending', 'inspection_completed',
    'financing_pending', 'financing_approved', 'appraisal_pending',
    'appraisal_completed', 'closing_scheduled'
  ];
  
  return activeStatuses.includes(status);
};

export const getTransactionProgress = (status: string): number => {
  const progressMap: { [key: string]: number } = {
    'inquiry': 5,
    'viewing_scheduled': 10,
    'offer_made': 20,
    'offer_accepted': 30,
    'under_contract': 40,
    'inspection_pending': 50,
    'inspection_completed': 60,
    'financing_pending': 70,
    'financing_approved': 80,
    'appraisal_pending': 85,
    'appraisal_completed': 90,
    'closing_scheduled': 95,
    'closed': 100,
    'cancelled': 0,
    'on_hold': 0
  };
  
  return progressMap[status] || 0;
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const calculateNetProceeds = (
  salePrice: number,
  commission: number,
  commissionType: 'percentage' | 'fixed',
  otherFees: number = 0
): number => {
  const commissionAmount = calculateCommissionAmount(salePrice, commission, commissionType);
  return salePrice - commissionAmount - otherFees;
};

