import Feedback from '../models/Feedback.js';
import Attendance from '../models/Attendance.js';
import AppError from '../utils/AppError.js';

/**
 * Feedback Service
 * All business logic for feedback operations.
 */

// ─────────────────────────────────────────────────────────────────
// STUDENT: Submit feedback
//
// Rules enforced:
//  1. Student must have a QR-scan (isPresent=true) for that meal on that date.
//  2. Feedback window closes at EOD of the day AFTER the meal date.
//  3. One feedback per student per meal per date.
// ─────────────────────────────────────────────────────────────────
export const submitFeedback = async (user, feedbackData) => {
  const {
    date, mealType, overallRating, categoryRatings,
    comments, suggestions, menuItems, images, isAnonymous, tags,
  } = feedbackData;

  const mealDate = new Date(date);
  mealDate.setHours(0, 0, 0, 0);

  // 1. Verify QR-scan attendance
  const attendance = await Attendance.findOne({ studentId: user._id, date: mealDate });
  const mealRecord = attendance?.meals?.find((m) => m.mealType === mealType && m.isPresent);

  if (!mealRecord) {
    throw new AppError(
      `You can only give feedback for meals you actually attended. ` +
      `No QR scan found for ${mealType} on ${mealDate.toDateString()}.`,
      400
    );
  }

  // 2. Check 24-hour window (EOD of next day)
  const windowEnd = new Date(mealDate);
  windowEnd.setDate(windowEnd.getDate() + 1);
  windowEnd.setHours(23, 59, 59, 999);

  if (new Date() > windowEnd) {
    throw new AppError(
      `Feedback window closed. You can rate meals until EOD of ${windowEnd.toDateString()}.`,
      400
    );
  }

  // 3. No duplicate
  const existing = await Feedback.findOne({ studentId: user._id, date: mealDate, mealType });
  if (existing) throw new AppError('Feedback already submitted for this meal', 400);

  return await Feedback.create({
    studentId: user._id,
    hostelId: user.hostelId,
    date: mealDate,
    mealType,
    overallRating,
    categoryRatings,
    comments,
    suggestions,
    menuItems,
    images,
    isAnonymous,
    tags,
  });
};

// ─────────────────────────────────────────────────────────────────
// STUDENT: Get meals eligible for feedback
// Returns meals the student attended AND feedback window still open.
// ─────────────────────────────────────────────────────────────────
export const getEligibleMealsForFeedback = async (user) => {
  const now = new Date();
  const since = new Date(now);
  since.setDate(since.getDate() - 2);
  since.setHours(0, 0, 0, 0);

  const records = await Attendance.find({
    studentId: user._id,
    date: { $gte: since },
    isOnLeave: false,
  });

  const eligible = [];

  for (const rec of records) {
    for (const meal of rec.meals) {
      if (!meal.isPresent) continue;

      const mealDate = new Date(rec.date);
      mealDate.setHours(0, 0, 0, 0);

      const windowEnd = new Date(mealDate);
      windowEnd.setDate(windowEnd.getDate() + 1);
      windowEnd.setHours(23, 59, 59, 999);

      if (now > windowEnd) continue;

      const alreadyDone = await Feedback.findOne({
        studentId: user._id,
        date: mealDate,
        mealType: meal.mealType,
      });

      if (!alreadyDone) eligible.push({ date: mealDate, mealType: meal.mealType });
    }
  }

  return eligible;
};

// ─────────────────────────────────────────────────────────────────
// STUDENT: Update own pending feedback
// ─────────────────────────────────────────────────────────────────
export const updateFeedback = async (user, feedbackId, updateData) => {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) throw new AppError('Feedback not found', 404);
  if (feedback.studentId.toString() !== user._id.toString())
    throw new AppError('You can only update your own feedback', 403);
  if (feedback.status !== 'pending')
    throw new AppError('Cannot update feedback that has been reviewed', 400);

  return await Feedback.findByIdAndUpdate(feedbackId, updateData, { new: true, runValidators: true });
};

// ─────────────────────────────────────────────────────────────────
// STUDENT: Get my feedback (paginated)
// ─────────────────────────────────────────────────────────────────
export const getMyFeedback = async (userId, { startDate, endDate, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const query = { studentId: userId };
  if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };

  const [feedbacks, total] = await Promise.all([
    Feedback.find(query).sort({ date: -1 }).skip(skip).limit(limit),
    Feedback.countDocuments(query),
  ]);

  return { feedbacks, total, page, limit };
};

// ─────────────────────────────────────────────────────────────────
// MANAGER/ADMIN: Consolidated report
// ─────────────────────────────────────────────────────────────────
export const getConsolidatedFeedback = async (user, { hostelId, month, year }) => {
  const targetHostel = hostelId || user.hostelId;
  if (user.role === 'manager' && user.hostelId !== targetHostel)
    throw new AppError('You can only view feedback for your assigned hostel', 403);

  return await Feedback.getConsolidatedReport(targetHostel, parseInt(month), parseInt(year));
};

// ─────────────────────────────────────────────────────────────────
// MANAGER/ADMIN: All feedbacks for a hostel (paginated, filtered)
// ─────────────────────────────────────────────────────────────────
export const getMessFeedbacks = async (user, filters) => {
  const { hostelId, status, mealType, startDate, endDate, minRating, maxRating, page = 1, limit = 20 } = filters;
  const targetHostel = hostelId || user.hostelId;
  const skip = (page - 1) * limit;

  if (user.role === 'manager' && user.hostelId !== targetHostel)
    throw new AppError('You can only view feedback for your assigned hostel', 403);

  const query = { hostelId: targetHostel };
  if (status) query.status = status;
  if (mealType) query.mealType = mealType;
  if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  if (minRating || maxRating) {
    query.overallRating = {};
    if (minRating) query.overallRating.$gte = parseInt(minRating);
    if (maxRating) query.overallRating.$lte = parseInt(maxRating);
  }

  const [feedbacks, total] = await Promise.all([
    Feedback.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('studentId', 'name registrationNumber hostelId'),
    Feedback.countDocuments(query),
  ]);

  return { feedbacks, total, page, limit };
};

// ─────────────────────────────────────────────────────────────────
// MANAGER/ADMIN: Pending feedbacks
// ─────────────────────────────────────────────────────────────────
export const getPendingFeedbacks = async (user, queryHostelId) => {
  const hostelId = queryHostelId || user.hostelId;
  if (user.role === 'manager' && user.hostelId !== hostelId)
    throw new AppError('You can only view feedback for your assigned hostel', 403);

  return await Feedback.getPendingFeedbacks(hostelId);
};

// ─────────────────────────────────────────────────────────────────
// MANAGER/ADMIN: Add response to feedback
// ─────────────────────────────────────────────────────────────────
export const addManagerResponse = async (user, feedbackId, { response, actionTaken, status }) => {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) throw new AppError('Feedback not found', 404);
  if (user.role === 'manager' && user.hostelId !== feedback.hostelId)
    throw new AppError('You can only respond to feedback for your assigned hostel', 403);

  feedback.addManagerResponse(user._id, response, actionTaken);
  if (status) feedback.status = status;
  await feedback.save();

  return await Feedback.findById(feedbackId)
    .populate('studentId', 'name registrationNumber')
    .populate('managerResponse.respondedBy', 'name email');
};

// ─────────────────────────────────────────────────────────────────
// MANAGER/ADMIN: Update feedback status
// ─────────────────────────────────────────────────────────────────
export const updateFeedbackStatus = async (user, feedbackId, status) => {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) throw new AppError('Feedback not found', 404);
  if (user.role === 'manager' && user.hostelId !== feedback.hostelId)
    throw new AppError('You can only update feedback for your assigned hostel', 403);

  feedback.status = status;
  await feedback.save();
  return feedback;
};

// ─────────────────────────────────────────────────────────────────
// Upvote / Remove upvote
// ─────────────────────────────────────────────────────────────────
export const upvoteFeedback = async (userId, feedbackId) => {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) throw new AppError('Feedback not found', 404);
  feedback.addUpvote(userId);
  await feedback.save();
  return { upvotes: feedback.upvotes };
};

export const removeUpvote = async (userId, feedbackId) => {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) throw new AppError('Feedback not found', 404);
  feedback.removeUpvote(userId);
  await feedback.save();
  return { upvotes: feedback.upvotes };
};

// ─────────────────────────────────────────────────────────────────
// Delete feedback
// ─────────────────────────────────────────────────────────────────
export const deleteFeedback = async (user, feedbackId) => {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) throw new AppError('Feedback not found', 404);

  if (user.role === 'student') {
    if (feedback.studentId.toString() !== user._id.toString())
      throw new AppError('You can only delete your own feedback', 403);
    if (feedback.status !== 'pending')
      throw new AppError('Cannot delete reviewed feedback', 400);
  }

  await feedback.deleteOne();
};

// ─────────────────────────────────────────────────────────────────
// ADMIN: Get feedback statistics
//   • Admin  → system-wide (all hostels) OR a specific hostel if hostelId provided
//   • Manager → scoped to their hostel
// ─────────────────────────────────────────────────────────────────
export const getFeedbackStatistics = async (user, { hostelId, month, year }) => {
  const selMonth = parseInt(month);
  const selYear  = parseInt(year);
  const startDate = new Date(selYear, selMonth - 1, 1);
  const endDate   = new Date(selYear, selMonth, 0, 23, 59, 59);

  // Build match — admin can query all hostels
  const matchQuery = { date: { $gte: startDate, $lte: endDate } };
  if (user.role === 'admin') {
    if (hostelId) matchQuery.hostelId = hostelId; // optional hostel filter
  } else {
    const targetHostel = hostelId || user.hostelId;
    if (user.role === 'manager' && user.hostelId !== targetHostel)
      throw new AppError('You can only view statistics for your assigned hostel', 403);
    matchQuery.hostelId = targetHostel;
  }

  const [avgRatings, mealWise, distribution] = await Promise.all([
    Feedback.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          avgOverallRating: { $avg: '$overallRating' },
          avgFoodQuality:   { $avg: '$categoryRatings.foodQuality' },
          avgTaste:         { $avg: '$categoryRatings.taste' },
          avgQuantity:      { $avg: '$categoryRatings.quantity' },
          avgHygiene:       { $avg: '$categoryRatings.hygiene' },
          avgService:       { $avg: '$categoryRatings.service' },
          totalFeedbacks:   { $sum: 1 },
        },
      },
    ]).then((r) => r[0] || null),

    Feedback.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$mealType', avgRating: { $avg: '$overallRating' }, count: { $sum: 1 } } },
      { $sort: { avgRating: -1 } },
    ]),

    Feedback.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$overallRating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]),
  ]);

  return { averageRatings: avgRatings, mealWiseRatings: mealWise, ratingDistribution: distribution };
};
