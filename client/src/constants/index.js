/**
 * Shared Constants
 *
 * Single source of truth for enums and config values
 * used across the client codebase.
 */

// ── Hostel list with labels ──────────────────────────────────────
export const HOSTELS = [
  { value: 'BH-1', label: 'BH-1 (Boys Hostel 1)' },
  { value: 'BH-2', label: 'BH-2 (Boys Hostel 2)' },
  { value: 'BH-3', label: 'BH-3 (Boys Hostel 3)' },
  { value: 'BH-4', label: 'BH-4 (Boys Hostel 4)' },
  { value: 'BH-5', label: 'BH-5 (Boys Hostel 5)' },
  { value: 'GH-1', label: 'GH-1 (Girls Hostel 1)' },
  { value: 'GH-2', label: 'GH-2 (Girls Hostel 2)' },
  { value: 'GH-3', label: 'GH-3 (Girls Hostel 3)' },
];

// ── Hostel values only (for quick checks) ────────────────────────
export const HOSTEL_VALUES = HOSTELS.map((h) => h.value);

// ── Meal types (3-meal system) ───────────────────────────────────
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

// ── User roles ───────────────────────────────────────────────────
export const ROLES = ['student', 'manager', 'admin'];
