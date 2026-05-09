import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/apiResponse.js';
import * as feedbackService from '../services/feedbackService.js';

// @desc    Get meals eligible for feedback (attended + window open)
// @route   GET /api/feedback/eligible-meals
// @access  Private (Student)
export const getEligibleMeals = asyncHandler(async (req, res) => {
  const meals = await feedbackService.getEligibleMealsForFeedback(req.user);
  sendSuccess(res, meals);
});

/**

 * Feedback Controller
 *
 * Handles HTTP request/response only.
 * All business logic lives in feedbackService.
 */

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private (Student)
export const submitFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.submitFeedback(req.user, req.body);
  sendCreated(res, feedback, 'Feedback submitted successfully');
});

// @desc    Update feedback
// @route   PUT /api/feedback/:id
// @access  Private (Student - own feedback)
export const updateFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.updateFeedback(req.user, req.params.id, req.body);
  sendSuccess(res, feedback, 'Feedback updated successfully');
});

// @desc    Get my feedback
// @route   GET /api/feedback/my-feedback
// @access  Private (Student)
export const getMyFeedback = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { startDate, endDate } = req.query;

  const result = await feedbackService.getMyFeedback(req.user._id, { startDate, endDate, page, limit });
  sendPaginated(res, result.feedbacks, result.page, result.limit, result.total);
});

// @desc    Get consolidated feedback
// @route   GET /api/feedback/consolidated
// @access  Private (Manager/Admin)
export const getConsolidatedFeedback = asyncHandler(async (req, res) => {
  const report = await feedbackService.getConsolidatedFeedback(req.user, req.query);
  sendSuccess(res, report);
});

// @desc    Get all feedbacks for mess
// @route   GET /api/feedback/mess
// @access  Private (Manager/Admin)
export const getMessFeedbacks = asyncHandler(async (req, res) => {
  const result = await feedbackService.getMessFeedbacks(req.user, req.query);
  sendPaginated(res, result.feedbacks, result.page, result.limit, result.total);
});

// @desc    Get pending feedbacks
// @route   GET /api/feedback/pending
// @access  Private (Manager/Admin)
export const getPendingFeedbacks = asyncHandler(async (req, res) => {
  const feedbacks = await feedbackService.getPendingFeedbacks(req.user, req.query.hostelId);
  sendSuccess(res, feedbacks);
});

// @desc    Add manager response
// @route   PUT /api/feedback/:id/respond
// @access  Private (Manager/Admin)
export const addManagerResponse = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.addManagerResponse(req.user, req.params.id, req.body);
  sendSuccess(res, feedback, 'Response added successfully');
});

// @desc    Update feedback status
// @route   PUT /api/feedback/:id/status
// @access  Private (Manager/Admin)
export const updateFeedbackStatus = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.updateFeedbackStatus(req.user, req.params.id, req.body.status);
  sendSuccess(res, feedback, 'Feedback status updated successfully');
});

// @desc    Upvote feedback
// @route   PUT /api/feedback/:id/upvote
// @access  Private (All authenticated users)
export const upvoteFeedback = asyncHandler(async (req, res) => {
  const result = await feedbackService.upvoteFeedback(req.user._id, req.params.id);
  sendSuccess(res, result, 'Feedback upvoted successfully');
});

// @desc    Remove upvote from feedback
// @route   DELETE /api/feedback/:id/upvote
// @access  Private (All authenticated users)
export const removeUpvote = asyncHandler(async (req, res) => {
  const result = await feedbackService.removeUpvote(req.user._id, req.params.id);
  sendSuccess(res, result, 'Upvote removed successfully');
});

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private (Student - own pending, Admin - any)
export const deleteFeedback = asyncHandler(async (req, res) => {
  await feedbackService.deleteFeedback(req.user, req.params.id);
  sendSuccess(res, null, 'Feedback deleted successfully');
});

// @desc    Get feedback statistics
// @route   GET /api/feedback/statistics
// @access  Private (Manager/Admin)
export const getFeedbackStatistics = asyncHandler(async (req, res) => {
  const stats = await feedbackService.getFeedbackStatistics(req.user, req.query);
  sendSuccess(res, stats);
});
