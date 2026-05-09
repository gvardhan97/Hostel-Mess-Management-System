import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/apiResponse.js';
import * as billService from '../services/billService.js';

/**
 * Bill Controller
 *
 * Handles HTTP request/response only.
 * All business logic lives in billService.
 */

// @desc    Get all bills stats with status breakdown
// @route   GET /api/bills/stats-all | GET /api/bills/stats-all/:month/:year
// @access  Private (Admin only)
export const getAllBillsStats = asyncHandler(async (req, res) => {
  const { month, year } = req.params;
  const stats = await billService.getAllBillsStats(month, year);
  sendSuccess(res, stats);
});

// @desc    Get total count of active students
// @route   GET /api/bills/students-count
// @access  Private (Admin only)
export const getStudentsCount = asyncHandler(async (req, res) => {
  const data = await billService.getStudentsCount();
  sendSuccess(res, data);
});

// @desc    Mark bills as paid (student self-confirmation)
// @route   PUT /api/bills/mark-paid
// @access  Private
export const markBillsAsPaid = asyncHandler(async (req, res) => {
  const { billIds, transactionId } = req.body;
  const count = await billService.markBillsAsPaid(req.user._id, billIds, transactionId);
  sendSuccess(res, null, `${count} bills marked as paid successfully`);
});

// @desc    Generate bill for a student
// @route   POST /api/bills/generate
// @access  Private (Admin only)
export const generateBill = asyncHandler(async (req, res) => {
  const bill = await billService.generateBill(req.user._id, req.body);
  sendCreated(res, bill, 'Bill generated successfully');
});

// @desc    Generate bills for all students in a mess
// @route   POST /api/bills/generate-all
// @access  Private (Admin only)
export const generateAllBills = asyncHandler(async (req, res) => {
  const result = await billService.generateAllBills(req.user._id, req.body);
  sendCreated(res, result, `Generated ${result.generated} bills successfully`);
});

// @desc    Get my bills
// @route   GET /api/bills/my-bills
// @access  Private (Student)
export const getMyBills = asyncHandler(async (req, res) => {
  const { year, paymentStatus } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await billService.getMyBills(req.user._id, { year, paymentStatus, page, limit });
  sendPaginated(res, result.bills, result.page, result.limit, result.total);
});

// @desc    Get bill by ID
// @route   GET /api/bills/:id
// @access  Private
export const getBillById = asyncHandler(async (req, res) => {
  const bill = await billService.getBillById(req.user, req.params.id);
  sendSuccess(res, bill);
});

// @desc    Get all bills for mess
// @route   GET /api/bills/mess/:hostelId
// @access  Private (Manager/Admin)
export const getMessBills = asyncHandler(async (req, res) => {
  const result = await billService.getMessBills(req.user, req.params.hostelId, req.query);
  sendPaginated(res, result.bills, result.page, result.limit, result.total);
});

// @desc    Get unpaid bills
// @route   GET /api/bills/unpaid/:hostelId
// @access  Private (Manager/Admin)
export const getUnpaidBills = asyncHandler(async (req, res) => {
  const bills = await billService.getUnpaidBills(req.user, req.params.hostelId);
  sendSuccess(res, bills);
});

// @desc    Get overdue bills
// @route   GET /api/bills/overdue/:hostelId
// @access  Private (Manager/Admin)
export const getOverdueBills = asyncHandler(async (req, res) => {
  const bills = await billService.getOverdueBills(req.user, req.params.hostelId);
  sendSuccess(res, bills);
});

// @desc    Add payment to bill
// @route   POST /api/bills/:id/payment
// @access  Private (Manager/Admin)
export const addPayment = asyncHandler(async (req, res) => {
  const bill = await billService.addPayment(req.user, req.params.id, req.body);
  sendSuccess(res, bill, 'Payment added successfully');
});

// @desc    Apply discount
// @route   PUT /api/bills/:id/discount
// @access  Private (Admin only)
export const applyDiscount = asyncHandler(async (req, res) => {
  const bill = await billService.applyDiscount(req.params.id, req.body);
  sendSuccess(res, bill, 'Discount applied successfully');
});

// @desc    Apply late fee
// @route   PUT /api/bills/:id/late-fee
// @access  Private (Admin only)
export const applyLateFee = asyncHandler(async (req, res) => {
  const bill = await billService.applyLateFee(req.params.id, req.body);
  sendSuccess(res, bill, 'Late fee applied successfully');
});

// @desc    Cancel bill
// @route   PUT /api/bills/:id/cancel
// @access  Private (Admin only)
export const cancelBill = asyncHandler(async (req, res) => {
  const bill = await billService.cancelBill(req.user._id, req.params.id, req.body.reason);
  sendSuccess(res, bill, 'Bill cancelled successfully');
});

// @desc    Get billing summary
// @route   GET /api/bills/summary/:hostelId/:month/:year
// @access  Private (Manager/Admin)
export const getBillingSummary = asyncHandler(async (req, res) => {
  const { hostelId, month, year } = req.params;
  const summary = await billService.getBillingSummary(req.user, hostelId, month, year);
  sendSuccess(res, summary);
});

// @desc    Auto-apply late fees
// @route   POST /api/bills/apply-late-fees
// @access  Private (Admin only)
export const autoApplyLateFees = asyncHandler(async (req, res) => {
  const result = await billService.autoApplyLateFees(req.body.lateFeeAmount);
  sendSuccess(res, result, `Late fees applied to ${result.billsUpdated} bills`);
});

// @desc    Update bill
// @route   PUT /api/bills/:id
// @access  Private (Admin only)
export const updateBill = asyncHandler(async (req, res) => {
  const bill = await billService.updateBill(req.params.id, req.body);
  sendSuccess(res, bill, 'Bill updated successfully');
});
