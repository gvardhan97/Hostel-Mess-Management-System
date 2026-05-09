import { body, query } from 'express-validator';
import { MEAL_TYPES } from '../constants/index.js';

// ── Submit feedback validation ───────────────────────────────────
export const submitFeedbackValidation = [
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date'),

  body('mealType')
    .notEmpty()
    .withMessage('Meal type is required')
    .isIn(MEAL_TYPES)
    .withMessage('Invalid meal type'),

  body('overallRating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Overall rating must be between 1 and 5'),

  body('categoryRatings')
    .optional()
    .isObject()
    .withMessage('Category ratings must be an object'),

  body('comments')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Comments cannot exceed 2000 characters'),

  body('suggestions')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Suggestions cannot exceed 1000 characters'),

  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),
];

// ── Update feedback validation ───────────────────────────────────
export const updateFeedbackValidation = [
  body('overallRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Overall rating must be between 1 and 5'),

  body('comments')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Comments cannot exceed 2000 characters'),
];

// ── Manager response validation ──────────────────────────────────
export const managerResponseValidation = [
  body('response')
    .notEmpty()
    .withMessage('Response text is required')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Response cannot exceed 2000 characters'),

  body('actionTaken')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Action taken cannot exceed 1000 characters'),

  body('status')
    .optional()
    .isIn(['pending', 'acknowledged', 'in_progress', 'resolved', 'dismissed'])
    .withMessage('Invalid status'),
];

// ── Update status validation ─────────────────────────────────────
export const updateStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'acknowledged', 'in_progress', 'resolved', 'dismissed'])
    .withMessage('Invalid status'),
];

// ── Feedback statistics validation ───────────────────────────────
export const feedbackStatsValidation = [
  query('month')
    .notEmpty()
    .withMessage('Month is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),

  query('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Year must be a valid year'),
];
