// services/transaction-service/src/middleware/validation.ts
import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

export const validateTransaction = [
  body('propertyId').isUUID().withMessage('Invalid property ID'),
  body('clientId').isUUID().withMessage('Invalid client ID'),
  body('buyerId').optional().isUUID().withMessage('Invalid buyer ID'),
  body('sellerId').optional().isUUID().withMessage('Invalid seller ID'),
  body('type').isIn(['sale', 'rental', 'lease']).withMessage('Invalid transaction type'),
  body('status').optional().isIn([
    'inquiry', 'viewing_scheduled', 'offer_made', 'offer_accepted',
    'under_contract', 'inspection_pending', 'inspection_completed',
    'financing_pending', 'financing_approved', 'appraisal_pending',
    'appraisal_completed', 'closing_scheduled', 'closed', 'cancelled', 'on_hold'
  ]).withMessage('Invalid transaction status'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('commission').isFloat({ min: 0 }).withMessage('Commission must be a positive number'),
  body('commissionType').optional().isIn(['percentage', 'fixed']).withMessage('Commission type must be percentage or fixed'),
  body('contractDate').optional().isISO8601().withMessage('Invalid contract date'),
  body('closingDate').optional().isISO8601().withMessage('Invalid closing date'),
  body('inspectionDate').optional().isISO8601().withMessage('Invalid inspection date'),
  body('downPayment').optional().isFloat({ min: 0 }).withMessage('Down payment must be positive'),
  body('loanAmount').optional().isFloat({ min: 0 }).withMessage('Loan amount must be positive'),
  handleValidationErrors
];

export const validateTransactionUpdate = [
  body('status').optional().isIn([
    'inquiry', 'viewing_scheduled', 'offer_made', 'offer_accepted',
    'under_contract', 'inspection_pending', 'inspection_completed',
    'financing_pending', 'financing_approved', 'appraisal_pending',
    'appraisal_completed', 'closing_scheduled', 'closed', 'cancelled', 'on_hold'
  ]).withMessage('Invalid transaction status'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('commission').optional().isFloat({ min: 0 }).withMessage('Commission must be a positive number'),
  body('appraisalValue').optional().isFloat({ min: 0 }).withMessage('Appraisal value must be positive'),
  body('contractDate').optional().isISO8601().withMessage('Invalid contract date'),
  body('closingDate').optional().isISO8601().withMessage('Invalid closing date'),
  body('inspectionDate').optional().isISO8601().withMessage('Invalid inspection date'),
  body('downPayment').optional().isFloat({ min: 0 }).withMessage('Down payment must be positive'),
  body('loanAmount').optional().isFloat({ min: 0 }).withMessage('Loan amount must be positive'),
  handleValidationErrors
];

export const validateTransactionId = [
  param('id').isUUID().withMessage('Invalid transaction ID'),
  handleValidationErrors
];

export const validateTransactionStatus = [
  body('status').isIn([
    'inquiry', 'viewing_scheduled', 'offer_made', 'offer_accepted',
    'under_contract', 'inspection_pending', 'inspection_completed',
    'financing_pending', 'financing_approved', 'appraisal_pending',
    'appraisal_completed', 'closing_scheduled', 'closed', 'cancelled', 'on_hold'
  ]).withMessage('Invalid transaction status'),
  handleValidationErrors
];

export const validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn([
    'inquiry', 'viewing_scheduled', 'offer_made', 'offer_accepted',
    'under_contract', 'inspection_pending', 'inspection_completed',
    'financing_pending', 'financing_approved', 'appraisal_pending',
    'appraisal_completed', 'closing_scheduled', 'closed', 'cancelled', 'on_hold'
  ]).withMessage('Invalid status filter'),
  query('agentId').optional().isUUID().withMessage('Invalid agent ID'),
  query('clientId').optional().isUUID().withMessage('Invalid client ID'),
  query('propertyId').optional().isUUID().withMessage('Invalid property ID'),
  handleValidationErrors
];
