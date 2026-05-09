import express from 'express';
import {
  submitFeedback,
  updateFeedback,
  getMyFeedback,
  getConsolidatedFeedback,
  getMessFeedbacks,
  getPendingFeedbacks,
  addManagerResponse,
  updateFeedbackStatus,
  upvoteFeedback,
  removeUpvote,
  deleteFeedback,
  getFeedbackStatistics,
  getEligibleMeals,
} from '../controllers/feedbackController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../validators/authValidator.js';
import {
  submitFeedbackValidation,
  updateFeedbackValidation,
  managerResponseValidation,
  updateStatusValidation,
  feedbackStatsValidation,
} from '../validators/feedbackValidator.js';

const router = express.Router();

// ── Student routes ───────────────────────────────────────────────
router.get('/eligible-meals', protect, authorize('student'), getEligibleMeals);
router.post('/', protect, authorize('student'), submitFeedbackValidation, validate, submitFeedback);
router.get('/my-feedback', protect, authorize('student'), getMyFeedback);
router.put('/:id', protect, authorize('student'), updateFeedbackValidation, validate, updateFeedback);


// ── Manager and Admin routes ─────────────────────────────────────
router.get('/consolidated', protect, authorize('manager', 'admin'), getConsolidatedFeedback);
router.get('/mess', protect, authorize('manager', 'admin'), getMessFeedbacks);
router.get('/pending', protect, authorize('manager', 'admin'), getPendingFeedbacks);
router.put('/:id/respond', protect, authorize('manager', 'admin'), managerResponseValidation, validate, addManagerResponse);
router.put('/:id/status', protect, authorize('manager', 'admin'), updateStatusValidation, validate, updateFeedbackStatus);
router.get('/statistics', protect, authorize('manager', 'admin'), feedbackStatsValidation, validate, getFeedbackStatistics);

// ── All authenticated users ──────────────────────────────────────
router.put('/:id/upvote', protect, upvoteFeedback);
router.delete('/:id/upvote', protect, removeUpvote);

// ── Delete — Student (own pending) or Admin (any) ────────────────
router.delete('/:id', protect, deleteFeedback);

export default router;
