import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

/**
 * Authentication Service
 *
 * Contains all business logic for authentication operations.
 * Controllers delegate to these methods and only handle HTTP concerns.
 */

// ── Private helper: generate JWT ─────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// ── Private helper: sanitize user object for response ────────────
const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  registrationNumber: user.registrationNumber,
  hostelId: user.hostelId,
});

/**
 * Register a new user.
 *
 * @param {Object} userData - Registration form data
 * @returns {{ user: Object, token: string }}
 * @throws {AppError} 400 if email/regNo already exists or hostelId missing
 */
export const registerUser = async (userData) => {
  const { name, email, password, role, registrationNumber, hostelId, contactNumber } = userData;

  // Check if email already taken
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    throw new AppError('User already exists with this email', 400);
  }

  // Check if registration number already taken (for students)
  if (registrationNumber) {
    const regExists = await User.findOne({ registrationNumber });
    if (regExists) {
      throw new AppError('Registration number already exists', 400);
    }
  }

  // Validate hostelId requirement for students and managers
  if ((role === 'student' || role === 'manager') && !hostelId) {
    throw new AppError(`Hostel ID is required for ${role}s`, 400);
  }

  // Create user (password hashing happens in the User model pre-save hook)
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'student',
    registrationNumber,
    hostelId,
    contactNumber,
  });

  const token = generateToken(user._id);

  return {
    user: sanitizeUser(user),
    token,
  };
};

/**
 * Authenticate a user with email OR roll number (case-insensitive) + password.
 *
 * @param {string} identifier - Email address or roll number (e.g. IEC2022047)
 * @param {string} password
 * @returns {{ user: Object, token: string }}
 * @throws {AppError} 401 if credentials invalid or account deactivated
 */
export const loginUser = async (identifier, password) => {
  const trimmed = identifier.trim();
  const isEmail = trimmed.includes('@');

  // Find user by email or roll number (case-insensitive)
  let user;
  if (isEmail) {
    user = await User.findOne({ email: trimmed.toLowerCase() }).select('+password');
  } else {
    // Case-insensitive regex match for registration number
    user = await User.findOne({
      registrationNumber: { $regex: new RegExp(`^${trimmed}$`, 'i') },
    }).select('+password');
  }

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated', 401);
  }

  // Verify password
  const isPasswordMatch = await user.matchPassword(password);
  if (!isPasswordMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = generateToken(user._id);

  return {
    user: sanitizeUser(user),
    token,
  };
};

/**
 * Get the currently authenticated user's profile.
 *
 * @param {string} userId - From req.user.id (set by auth middleware)
 * @returns {Object} User profile (excluding password)
 * @throws {AppError} 404 if user not found
 */
export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return sanitizeUser(user);
};
