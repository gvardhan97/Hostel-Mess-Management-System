import User from '../models/User.js';
import Bill from '../models/Bill.js';
import AppError from '../utils/AppError.js';

/**
 * Profile Service — returns role-specific aggregated profile data.
 */

/**
 * Build a student's profile data.
 */
const getStudentProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  // All bills for this student
  const bills = await Bill.find({ studentId: userId, isActive: true, isCancelled: false })
    .sort({ year: -1, month: -1 })
    .limit(50);

  // Bill stats
  const billStats = bills.reduce(
    (acc, b) => {
      acc.total++;
      if (b.paymentStatus === 'paid' || b.paymentStatus === 'waived') {
        acc.paid++;
        acc.totalPaid += b.amountPaid || 0;
      } else {
        acc.unpaid++;
        acc.totalDue += b.amountDue || b.totalAmount || 0;
      }
      return acc;
    },
    { total: 0, paid: 0, unpaid: 0, totalPaid: 0, totalDue: 0 }
  );

  // Recent 3 bills
  const recentBills = bills.slice(0, 3).map((b) => ({
    _id: b._id,
    month: b.month,
    year: b.year,
    totalAmount: b.totalAmount,
    amountDue: b.amountDue,
    paymentStatus: b.paymentStatus,
  }));

  // This month's bill meal breakdown
  const thisBill = bills.find((b) => b.month === month && b.year === year);
  const attendanceThisMonth = thisBill?.mealWiseCharges?.reduce(
    (acc, m) => {
      acc[m.mealType] = m.daysConsumed || 0;
      acc.total += m.daysConsumed || 0;
      return acc;
    },
    { breakfast: 0, lunch: 0, dinner: 0, total: 0 }
  ) || { breakfast: 0, lunch: 0, dinner: 0, total: 0 };

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      registrationNumber: user.registrationNumber,
      hostelId: user.hostelId,
      contactNumber: user.contactNumber,
      isActive: user.isActive,
      createdAt: user.createdAt,
      role: user.role,
    },
    billStats,
    recentBills,
    attendanceThisMonth,
  };
};

/**
 * Build a manager's profile data.
 */
const getManagerProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const hostelId = user.hostelId;

  const [totalStudents, billsThisMonth, unpaidBills] = await Promise.all([
    User.countDocuments({ hostelId, role: 'student', isActive: true }),
    Bill.countDocuments({ hostelId, month, year, isActive: true, isCancelled: false }),
    Bill.countDocuments({
      hostelId,
      paymentStatus: { $in: ['unpaid', 'partially_paid', 'overdue'] },
      isActive: true,
      isCancelled: false,
    }),
  ]);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      hostelId: user.hostelId,
      contactNumber: user.contactNumber,
      isActive: user.isActive,
      createdAt: user.createdAt,
      role: user.role,
    },
    hostelStats: { totalStudents, billsThisMonth, unpaidCount: unpaidBills },
  };
};

/**
 * Build an admin's profile data.
 */
const getAdminProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const [totalStudents, totalManagers, billStats] = await Promise.all([
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'manager', isActive: true }),
    Bill.aggregate([
      { $match: { month, year, isActive: true, isCancelled: false } },
      {
        $group: {
          _id: null,
          totalBills: { $sum: 1 },
          paidBills:   { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } },
          unpaidBills: { $sum: { $cond: [{ $in: ['$paymentStatus', ['unpaid', 'partially_paid', 'overdue']] }, 1, 0] } },
          totalRevenue: { $sum: '$amountPaid' },
        },
      },
    ]),
  ]);

  const bs = billStats[0] || { totalBills: 0, paidBills: 0, unpaidBills: 0, totalRevenue: 0 };

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
    systemStats: {
      totalStudents,
      totalManagers,
      ...bs,
      currentMonth: month,
      currentYear: year,
    },
  };
};

/**
 * Main entry point — dispatches to role-specific profile builder.
 */
export const getProfile = async (user) => {
  switch (user.role) {
    case 'student': return getStudentProfile(user._id);
    case 'manager': return getManagerProfile(user._id);
    case 'admin':   return getAdminProfile(user._id);
    default:        throw new AppError('Unknown role', 400);
  }
};
