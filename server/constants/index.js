/**
 * Shared Constants
 *
 * Single source of truth for enums, rates, and config values
 * used across the server codebase.
 */

// ── Hostel IDs (IIITA campus) ────────────────────────────────────
export const HOSTELS = ['BH-1', 'BH-2', 'BH-3', 'BH-4', 'BH-5', 'GH-1', 'GH-2', 'GH-3'];

// ── Meal types (3-meal system) ───────────────────────────────────
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

// ── User roles ───────────────────────────────────────────────────
export const ROLES = ['student', 'manager', 'admin'];

// ── Default meal rates (₹ per meal) ─────────────────────────────
export const DEFAULT_MEAL_RATES = {
  breakfast: 30,
  lunch: 50,
  dinner: 50,
};

export const DEFAULT_FIXED_CHARGES = 0;

// ── Meal time windows (for QR token validation) ─────────────────
export const MEAL_WINDOWS = {
  breakfast: { start: 7, end: 10 },
  lunch:     { start: 12, end: 15 },
  dinner:    { start: 19, end: 22 },
};

// ── Leave reasons ────────────────────────────────────────────────
export const LEAVE_REASONS = ['vacation', 'sick_leave', 'home_visit', 'emergency', 'other'];

// ── Feedback tags ────────────────────────────────────────────────
export const FEEDBACK_TAGS = [
  'food_quality', 'portion_size', 'temperature',
  'late_service', 'cleanliness', 'staff_behavior', 'variety', 'other',
];

// ── Feedback statuses ────────────────────────────────────────────
export const FEEDBACK_STATUSES = ['pending', 'reviewed', 'resolved', 'rejected'];

// ── Payment methods ──────────────────────────────────────────────
export const PAYMENT_METHODS = ['cash', 'online', 'upi', 'card', 'bank_transfer', 'other'];

// ── Bill payment statuses ────────────────────────────────────────
export const BILL_STATUSES = ['unpaid', 'partially_paid', 'paid', 'overdue', 'waived'];
