import Bill from '../models/Bill.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { DEFAULT_MEAL_RATES, DEFAULT_FIXED_CHARGES } from '../constants/index.js';

/**
 * Round bill total to nearest rupee and save if changed.
 * @private
 */
const ensureRoundedTotal = async (bill) => {
  if (!bill || bill.totalAmount == null) return bill;

  const rounded = Math.round(Number(bill.totalAmount));

  if (bill.isModified !== undefined) {
    if (rounded !== bill.totalAmount) {
      bill.totalAmount = rounded;
      await bill.save();
    }
    return bill;
  }

  bill.totalAmount = rounded;
  return bill;
};

/**
 * Get all bills stats with optional month/year filter.
 */
export const getAllBillsStats = async (month, year) => {
  const match = { isActive: true, isCancelled: false };

  if (month && year) {
    match.month = parseInt(month);
    match.year  = parseInt(year);
  }

  const result = await Bill.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalBills:         { $sum: 1 },
        paidBills:          { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] },             1, 0] } },
        unpaidBills:        { $sum: { $cond: [{ $eq: ['$paymentStatus', 'unpaid'] },           1, 0] } },
        partiallyPaidBills: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'partially_paid'] },   1, 0] } },
        overdueBills:       { $sum: { $cond: [{ $eq: ['$paymentStatus', 'overdue'] },          1, 0] } },
        waivedBills:        { $sum: { $cond: [{ $eq: ['$paymentStatus', 'waived'] },           1, 0] } },
        totalAmount:        { $sum: '$totalAmount' },
        totalCollected:     { $sum: '$amountPaid' },
        totalDue:           { $sum: '$amountDue' },
      },
    },
  ]);

  return result.length > 0
    ? result[0]
    : {
        totalBills: 0, paidBills: 0, unpaidBills: 0,
        partiallyPaidBills: 0, overdueBills: 0, waivedBills: 0,
        totalAmount: 0, totalCollected: 0, totalDue: 0,
      };
};


/**
 * Get total active students count.
 */
export const getStudentsCount = async () => {
  const count = await User.countDocuments({ role: 'student', isActive: true });
  return { totalStudents: count };
};

/**
 * Mark bills as paid by a student.
 */
export const markBillsAsPaid = async (userId, billIds, transactionId = '') => {
  const bills = await Bill.find({
    _id: { $in: billIds },
    studentId: userId,
    isActive: true,
    isCancelled: false,
  });

  if (bills.length === 0) {
    throw new AppError('No valid bills found for this user', 404);
  }

  const txnId = transactionId?.trim() || `self-${Date.now()}`;

  for (const bill of bills) {
    bill.amountPaid = bill.totalAmount;
    bill.amountDue = 0;
    bill.paymentStatus = 'paid';
    bill.paidDate = new Date();
    bill.paymentHistory.push({
      amount: bill.totalAmount,
      paymentMethod: 'upi',
      transactionId: txnId,
      paymentStatus: 'success',
      remarks: `Student self-confirmation via UPI (UTR: ${txnId})`,
      receivedBy: userId,
    });
    await bill.save();
  }

  return bills.length;
};

/**
 * Generate a bill for a single student.
 */
export const generateBill = async (userId, { studentId, hostelId, month, year, mealRates, fixedCharges }) => {
  const rates = mealRates || DEFAULT_MEAL_RATES;
  const fixed = fixedCharges || DEFAULT_FIXED_CHARGES;

  const bill = await Bill.generateFromAttendance(studentId, hostelId, month, year, rates, fixed, userId);

  // Ensure rounding
  const doc = await Bill.findById(bill._id);
  await ensureRoundedTotal(doc);

  // Return populated bill
  const finalBill = await Bill.findById(bill._id).populate(
    'studentId',
    'name email registrationNumber hostelId'
  );

  return finalBill;
};

/**
 * Generate bills for all students in a mess.
 */
export const generateAllBills = async (userId, { hostelId, month, year, mealRates, fixedCharges }) => {
  const rates = mealRates || DEFAULT_MEAL_RATES;
  const fixed = fixedCharges || DEFAULT_FIXED_CHARGES;

  const students = await User.find({ hostelId, role: 'student', isActive: true });

  const generatedBills = [];
  const errors = [];

  for (const student of students) {
    try {
      const bill = await Bill.generateFromAttendance(student._id, hostelId, month, year, rates, fixed, userId);

      const doc = await Bill.findById(bill._id);
      await ensureRoundedTotal(doc);

      generatedBills.push(bill);
    } catch (error) {
      errors.push({
        studentId: student._id,
        name: student.name,
        error: error.message,
      });
    }
  }

  return {
    generated: generatedBills.length,
    errors: errors.length,
    errorDetails: errors,
  };
};

/**
 * Get bills for the logged-in student.
 */
export const getMyBills = async (userId, { year, paymentStatus, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const query = {
    studentId: userId,
    isActive: true,
    isCancelled: false,
  };

  if (year) query.year = parseInt(year);
  if (paymentStatus) query.paymentStatus = paymentStatus;

  const bills = await Bill.find(query)
    .sort({ year: -1, month: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Bill.countDocuments(query);

  return { bills, total, page, limit };
};

/**
 * Get bill by ID with authorization checks.
 */
export const getBillById = async (user, billId) => {
  const bill = await Bill.findById(billId)
    .populate('studentId', 'name email registrationNumber hostelId')
    .populate('generatedBy', 'name email')
    .populate('paymentHistory.receivedBy', 'name email');

  if (!bill) {
    throw new AppError('Bill not found', 404);
  }

  // Students can only view their own bills
  if (user.role === 'student' && bill.studentId._id.toString() !== user._id.toString()) {
    throw new AppError('You can only view your own bills', 403);
  }

  // Managers can only view bills for their mess
  if (user.role === 'manager' && bill.hostelId !== user.hostelId) {
    throw new AppError('You can only view bills for your assigned hostel', 403);
  }

  return bill;
};

/**
 * Get all bills for a hostel (paginated).
 */
export const getMessBills = async (user, hostelId, filters) => {
  if (user.role === 'manager' && user.hostelId !== hostelId) {
    throw new AppError('You can only view bills for your assigned hostel', 403);
  }

  const { month, year, paymentStatus, studentId, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const query = { hostelId, isActive: true, isCancelled: false };

  if (month) query.month = parseInt(month);
  if (year) query.year = parseInt(year);
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (studentId) query.studentId = studentId;

  const bills = await Bill.find(query)
    .sort({ year: -1, month: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('studentId', 'name registrationNumber hostelId email');

  const total = await Bill.countDocuments(query);

  return { bills, total, page, limit };
};

/**
 * Get unpaid bills for a hostel.
 */
export const getUnpaidBills = async (user, hostelId) => {
  if (user.role === 'manager' && user.hostelId !== hostelId) {
    throw new AppError('You can only view bills for your assigned hostel', 403);
  }

  return await Bill.getUnpaidBills(hostelId);
};

/**
 * Get overdue bills for a hostel.
 */
export const getOverdueBills = async (user, hostelId) => {
  if (user.role === 'manager' && user.hostelId !== hostelId) {
    throw new AppError('You can only view bills for your assigned hostel', 403);
  }

  return await Bill.getOverdueBills(hostelId);
};

/**
 * Add payment to a bill.
 */
export const addPayment = async (user, billId, { amount, paymentMethod, transactionId, remarks }) => {
  const bill = await Bill.findById(billId);

  if (!bill) {
    throw new AppError('Bill not found', 404);
  }

  if (user.role === 'manager' && bill.hostelId !== user.hostelId) {
    throw new AppError('You can only process payments for your assigned hostel', 403);
  }

  if (amount > bill.amountDue) {
    throw new AppError('Payment amount exceeds due amount', 400);
  }

  bill.addPayment(amount, paymentMethod, transactionId, user._id, remarks);
  await bill.save();

  return await Bill.findById(bill._id)
    .populate('studentId', 'name registrationNumber')
    .populate('paymentHistory.receivedBy', 'name email');
};

/**
 * Apply discount to a bill.
 * Accepts: { discount, discountReason } OR { discountAmount, reason }
 */
export const applyDiscount = async (billId, body) => {
  const bill = await Bill.findById(billId);

  if (!bill) {
    throw new AppError('Bill not found', 404);
  }

  // Accept either naming convention from the request body
  const discountAmount = Number(body.discount ?? body.discountAmount ?? 0);
  const reason = (body.discountReason ?? body.reason ?? '').trim();

  if (discountAmount <= 0) {
    throw new AppError('Discount amount must be greater than 0', 400);
  }

  // Use totalAmount as ceiling (what the admin sees on screen)
  // Add small epsilon to avoid floating-point rejection on full waiver
  const grossTotal = bill.baseAmount + bill.fixedCharges + bill.lateFee + bill.adjustments;
  if (discountAmount > grossTotal + 0.01) {
    throw new AppError(`Discount (₹${discountAmount}) cannot exceed bill total (₹${grossTotal.toFixed(2)})`, 400);
  }

  bill.discount = discountAmount;
  bill.discountReason = reason;
  await bill.save(); // pre-save recalculates totalAmount and sets paymentStatus

  return await Bill.findById(bill._id)
    .populate('studentId', 'name registrationNumber email hostelId');
};


/**
 * Apply late fee to a bill.
 */
export const applyLateFee = async (billId, { feeAmount, reason }) => {
  const bill = await Bill.findById(billId);

  if (!bill) {
    throw new AppError('Bill not found', 404);
  }

  bill.applyLateFee(feeAmount, reason);
  await bill.save();
  await ensureRoundedTotal(bill);

  return bill;
};

/**
 * Cancel a bill.
 */
export const cancelBill = async (userId, billId, reason) => {
  const bill = await Bill.findById(billId);

  if (!bill) {
    throw new AppError('Bill not found', 404);
  }

  bill.cancelBill(userId, reason);
  await bill.save();

  return bill;
};

/**
 * Get billing summary for a hostel/month/year.
 */
export const getBillingSummary = async (user, hostelId, month, year) => {
  if (user.role === 'manager' && user.hostelId !== hostelId) {
    throw new AppError('You can only view summary for your assigned hostel', 403);
  }

  const summary = await Bill.getBillingSummary(hostelId, parseInt(month), parseInt(year));

  if (!summary) {
    throw new AppError('No billing data found for the specified period', 404);
  }

  return summary;
};

/**
 * Auto-apply late fees to overdue bills.
 */
export const autoApplyLateFees = async (lateFeeAmount) => {
  const amount = lateFeeAmount || 50;
  const count = await Bill.applyLateFees(amount);
  return { billsUpdated: count };
};

/**
 * Update a bill.
 */
export const updateBill = async (billId, updateData) => {
  const bill = await Bill.findById(billId);

  if (!bill) {
    throw new AppError('Bill not found', 404);
  }

  let updatedBill = await Bill.findByIdAndUpdate(billId, updateData, {
    new: true,
    runValidators: true,
  }).populate('studentId', 'name registrationNumber');

  const doc = await Bill.findById(updatedBill._id);
  await ensureRoundedTotal(doc);

  // Re-populate after possible save
  updatedBill = await Bill.findById(updatedBill._id)
    .populate('studentId', 'name registrationNumber');

  return updatedBill;
};
