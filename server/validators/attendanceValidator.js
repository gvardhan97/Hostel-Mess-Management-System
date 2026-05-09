import { body, query, param } from 'express-validator';
import { MEAL_TYPES } from '../constants/index.js';

// ── Mark attendance validation ───────────────────────────────────
export const markAttendanceValidation = [
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),

  body('meals')
    .optional()
    .isArray()
    .withMessage('Meals must be an array'),

  body('meals.*.mealType')
    .optional()
    .isIn(MEAL_TYPES)
    .withMessage('Invalid meal type'),

  body('meals.*.isPresent')
    .optional()
    .isBoolean()
    .withMessage('isPresent must be a boolean'),

  body('isOnLeave')
    .optional()
    .isBoolean()
    .withMessage('isOnLeave must be a boolean'),
];

// ── Register leave validation ────────────────────────────────────
export const registerLeaveValidation = [
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date'),

  body('reason')
    .optional()
    .isIn(['vacation', 'sick_leave', 'home_visit', 'emergency', 'other'])
    .withMessage('Invalid leave reason'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
];

// ── Get my attendance validation ─────────────────────────────────
export const getMyAttendanceValidation = [
  query('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date'),
];

// ── Monthly attendance validation ────────────────────────────────
export const monthlyAttendanceValidation = [
  param('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),

  param('year')
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Year must be a valid year'),
];
