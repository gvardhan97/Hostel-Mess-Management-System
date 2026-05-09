import { body, param, query } from 'express-validator';

// ── Generate bill validation ─────────────────────────────────────
export const generateBillValidation = [
  body('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Student ID must be a valid ID'),

  body('hostelId')
    .notEmpty()
    .withMessage('Hostel ID is required'),

  body('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),

  body('year')
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Year must be a valid year'),

  body('mealRates')
    .optional()
    .isObject()
    .withMessage('Meal rates must be an object'),

  body('fixedCharges')
    .optional()
    .isNumeric()
    .withMessage('Fixed charges must be a number'),
];

// ── Generate all bills validation ────────────────────────────────
export const generateAllBillsValidation = [
  body('hostelId')
    .notEmpty()
    .withMessage('Hostel ID is required'),

  body('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),

  body('year')
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Year must be a valid year'),
];

// ── Add payment validation ───────────────────────────────────────
export const addPaymentValidation = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom((value) => value > 0)
    .withMessage('Amount must be greater than 0'),

  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required'),

  body('transactionId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Transaction ID cannot be empty'),
];

// ── Apply discount validation ────────────────────────────────────
// Accepts: discount (number) + discountReason (optional string)
export const applyDiscountValidation = [
  body('discount')
    .isNumeric()
    .withMessage('Discount amount must be a number')
    .custom((value) => Number(value) > 0)
    .withMessage('Discount amount must be greater than 0'),

  body('discountReason')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Discount reason cannot be empty if provided'),
];

// ── Apply late fee validation ────────────────────────────────────
export const applyLateFeeValidation = [
  body('feeAmount')
    .isNumeric()
    .withMessage('Fee amount must be a number')
    .custom((value) => value > 0)
    .withMessage('Fee amount must be greater than 0'),

  body('reason')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Reason cannot be empty'),
];

// ── Mark bills as paid validation ────────────────────────────────
export const markBillsPaidValidation = [
  body('billIds')
    .isArray({ min: 1 })
    .withMessage('billIds must be a non-empty array'),

  body('billIds.*')
    .isMongoId()
    .withMessage('Each bill ID must be a valid ID'),
];

// ── Billing summary params validation ────────────────────────────
export const billingSummaryValidation = [
  param('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),

  param('year')
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Year must be a valid year'),
];
