import Razorpay from 'razorpay';
import crypto from 'crypto';
import Bill from '../models/Bill.js';
import AppError from '../utils/AppError.js';

/**
 * Payment Service — Razorpay Integration
 *
 * Handles order creation, payment verification, and bill status updates.
 * All payment verification is done server-side via HMAC signature validation.
 */

// ── Razorpay instance (lazy-initialized) ─────────────────────────
let razorpayInstance = null;

const getRazorpay = () => {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new AppError(
        'Razorpay API keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env',
        500
      );
    }

    razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return razorpayInstance;
};

/**
 * Create a Razorpay order for the given bill IDs.
 *
 * @param {string}   userId  - Logged-in student's ID
 * @param {string[]} billIds - Array of bill _id values
 * @returns {{ orderId, amount, currency, key, bills }}
 */
export const createOrder = async (userId, billIds) => {
  if (!billIds || billIds.length === 0) {
    throw new AppError('No bills selected for payment', 400);
  }

  // Fetch only this student's unpaid / active bills
  const bills = await Bill.find({
    _id: { $in: billIds },
    studentId: userId,
    isActive: true,
    isCancelled: false,
    paymentStatus: { $in: ['unpaid', 'partially_paid', 'overdue'] },
  });

  if (bills.length === 0) {
    throw new AppError('No valid unpaid bills found for payment', 404);
  }

  // Calculate total amount due (in rupees)
  const totalRupees = bills.reduce((sum, b) => sum + (b.amountDue || b.totalAmount), 0);

  if (totalRupees <= 0) {
    throw new AppError('Total payment amount must be greater than zero', 400);
  }

  // Razorpay expects amount in paise (1 rupee = 100 paise)
  const amountPaise = Math.round(totalRupees * 100);

  // Create Razorpay order
  const razorpay = getRazorpay();
  let order;
  try {
    order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `mess_${Date.now().toString(36)}`,   // max 40 chars
      notes: {
        studentId: userId.toString(),
        billIds: JSON.stringify(billIds),
        billCount: bills.length.toString(),
      },
    });
  } catch (razorpayError) {
    console.error('Razorpay order creation error:', JSON.stringify(razorpayError));
    throw new AppError(
      `Razorpay error: ${razorpayError?.error?.description || razorpayError?.message || 'Failed to create order'}`,
      400
    );
  }

  return {
    orderId: order.id,
    amount: amountPaise,
    amountRupees: totalRupees,
    currency: order.currency,
    key: process.env.RAZORPAY_KEY_ID,
    bills: bills.map((b) => ({
      _id: b._id,
      month: b.month,
      year: b.year,
      amountDue: b.amountDue || b.totalAmount,
    })),
  };
};

/**
 * Verify Razorpay payment signature and mark bills as paid.
 *
 * @param {string}   userId              - Logged-in student's ID
 * @param {string}   razorpay_order_id   - From Razorpay checkout response
 * @param {string}   razorpay_payment_id - From Razorpay checkout response
 * @param {string}   razorpay_signature  - HMAC signature from Razorpay
 * @param {string[]} billIds             - Bills that were being paid
 * @returns {{ verified, billsUpdated, paymentId }}
 */
export const verifyPayment = async (
  userId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  billIds
) => {
  // ── Step 1: Verify HMAC signature ──────────────────────────────
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw new AppError('Payment verification failed — invalid signature', 400);
  }

  // ── Step 2: Mark bills as paid ─────────────────────────────────
  const bills = await Bill.find({
    _id: { $in: billIds },
    studentId: userId,
    isActive: true,
    isCancelled: false,
  });

  if (bills.length === 0) {
    throw new AppError('No valid bills found to update after payment', 404);
  }

  for (const bill of bills) {
    bill.amountPaid = bill.totalAmount;
    bill.amountDue = 0;
    bill.paymentStatus = 'paid';
    bill.paidDate = new Date();
    bill.paymentHistory.push({
      amount: bill.totalAmount,
      paymentMethod: 'upi',
      transactionId: razorpay_payment_id,
      paymentStatus: 'success',
      remarks: `Razorpay verified (Order: ${razorpay_order_id})`,
      receivedBy: userId,
    });
    await bill.save();
  }

  return {
    verified: true,
    billsUpdated: bills.length,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
  };
};
