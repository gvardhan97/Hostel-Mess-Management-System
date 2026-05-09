import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as paymentService from '../services/paymentService.js';

/**
 * Payment Controller
 *
 * HTTP layer only — all business logic lives in paymentService.
 */

// @desc    Create a Razorpay order for selected bills
// @route   POST /api/payments/create-order
// @access  Private (Student)
export const createOrder = asyncHandler(async (req, res) => {
  const { billIds } = req.body;
  const order = await paymentService.createOrder(req.user._id, billIds);
  sendSuccess(res, order, 'Razorpay order created');
});

// @desc    Verify Razorpay payment signature and mark bills paid
// @route   POST /api/payments/verify
// @access  Private (Student)
export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    billIds,
  } = req.body;

  const result = await paymentService.verifyPayment(
    req.user._id,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    billIds
  );

  sendSuccess(res, result, 'Payment verified and bills updated');
});
