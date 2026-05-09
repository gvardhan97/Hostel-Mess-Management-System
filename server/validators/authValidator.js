import { body, validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';
import { HOSTELS, ROLES } from '../constants/index.js';

// ── Reusable validation runner ───────────────────────────────────
/**
 * Middleware that checks express-validator results.
 * If there are errors, throws an AppError(400) with all messages.
 * Place this AFTER the validation rules in the route chain.
 *
 * Usage in routes:
 *   router.post('/register', registerValidation, validate, controller);
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => err.msg);
    throw new AppError(messages.join('. '), 400);
  }

  next();
};

// ── Registration validation rules ────────────────────────────────
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('role')
    .optional()
    .isIn(ROLES)
    .withMessage(`Invalid role. Must be one of: ${ROLES.join(', ')}`),

  body('contactNumber')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Contact number must be a valid 10-digit number'),

  body('hostelId')
    .if(body('role').isIn(['student', 'manager']))
    .notEmpty()
    .withMessage('Hostel ID is required for students and managers')
    .isIn(HOSTELS)
    .withMessage(`Invalid hostel. Must be one of: ${HOSTELS.join(', ')}`),
];

// ── Login validation rules ───────────────────────────────────────
export const loginValidation = [
  // Accept 'identifier' (new) or 'email' (legacy) — either an email or a roll number
  body('identifier')
    .if(body('email').not().exists())   // only check identifier when email is absent
    .notEmpty()
    .withMessage('Email or roll number is required')
    .custom((value) => {
      const isEmail = value.includes('@');
      if (isEmail) {
        // Validate as email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) throw new Error('Please provide a valid email');
      } else {
        // Validate as roll number (alphanumeric with optional hyphens/underscores)
        const rollRegex = /^[a-zA-Z0-9_-]+$/;
        if (!rollRegex.test(value)) throw new Error('Please provide a valid roll number or email');
      }
      return true;
    }),

  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];
