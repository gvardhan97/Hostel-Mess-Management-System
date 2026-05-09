import mongoose from 'mongoose';
import { MEAL_TYPES } from '../constants/index.js';

// Sub-schema for category-wise ratings
const CategoryRatingSchema = new mongoose.Schema(
  {
    foodQuality: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    taste: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    quantity: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    hygiene: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    service: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
  },
  { _id: false }
);

// Main Feedback Schema
const FeedbackSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    hostelId: {
      type: String,
      required: [true, 'Hostel ID is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    mealType: {
      type: String,
      enum: MEAL_TYPES,
      required: [true, 'Meal type is required'],
    },
    overallRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      required: [true, 'Overall rating is required'],
    },
    categoryRatings: {
      type: CategoryRatingSchema,
      required: true,
    },
    comments: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comments cannot exceed 1000 characters'],
    },
    suggestions: {
      type: String,
      trim: true,
      maxlength: [500, 'Suggestions cannot exceed 500 characters'],
    },
    menuItems: [{
      type: String,
      trim: true,
    }],
    images: [{
      type: String,
      trim: true,
    }],
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'rejected'],
      default: 'pending',
    },
    managerResponse: {
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      response: {
        type: String,
        trim: true,
        maxlength: [1000, 'Response cannot exceed 1000 characters'],
      },
      responseDate: {
        type: Date,
      },
      actionTaken: {
        type: String,
        trim: true,
      },
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    tags: [{
      type: String,
      enum: ['food_quality', 'portion_size', 'temperature', 'late_service', 'cleanliness', 'staff_behavior', 'variety', 'other'],
    }],
    upvotes: {
      type: Number,
      default: 0,
    },
    upvotedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    isResolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
FeedbackSchema.index({ studentId: 1, date: 1, mealType: 1 });
FeedbackSchema.index({ hostelId: 1, date: 1 });
FeedbackSchema.index({ hostelId: 1, status: 1 });
FeedbackSchema.index({ overallRating: 1, date: -1 });
FeedbackSchema.index({ status: 1, priority: -1 });

// Pre-save middleware to auto-set priority based on rating
FeedbackSchema.pre('save', function (next) {
  if (this.isModified('overallRating')) {
    if (this.overallRating <= 2) {
      this.priority = 'critical';
    } else if (this.overallRating === 3) {
      this.priority = 'high';
    } else if (this.overallRating === 4) {
      this.priority = 'medium';
    } else {
      this.priority = 'low';
    }
  }
  
  // Set resolvedAt when status changes to resolved
  if (this.isModified('status') && this.status === 'resolved') {
    this.isResolved = true;
    this.resolvedAt = new Date();
  }
  
  next();
});

// Method to add manager response
FeedbackSchema.methods.addManagerResponse = function (managerId, response, actionTaken) {
  this.managerResponse = {
    respondedBy: managerId,
    response,
    responseDate: new Date(),
    actionTaken,
  };
  this.status = 'reviewed';
};

// Method to upvote feedback
FeedbackSchema.methods.addUpvote = function (userId) {
  if (!this.upvotedBy.includes(userId)) {
    this.upvotedBy.push(userId);
    this.upvotes += 1;
  }
};

// Method to remove upvote
FeedbackSchema.methods.removeUpvote = function (userId) {
  const index = this.upvotedBy.indexOf(userId);
  if (index > -1) {
    this.upvotedBy.splice(index, 1);
    this.upvotes -= 1;
  }
};

// Static method to get average ratings for a mess
FeedbackSchema.statics.getAverageRatings = async function (hostelId, startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        hostelId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        avgOverallRating: { $avg: '$overallRating' },
        avgFoodQuality: { $avg: '$categoryRatings.foodQuality' },
        avgTaste: { $avg: '$categoryRatings.taste' },
        avgQuantity: { $avg: '$categoryRatings.quantity' },
        avgHygiene: { $avg: '$categoryRatings.hygiene' },
        avgService: { $avg: '$categoryRatings.service' },
        totalFeedbacks: { $sum: 1 },
      },
    },
  ]);
  
  return result.length > 0 ? result[0] : null;
};

// Static method to get meal-wise ratings
FeedbackSchema.statics.getMealWiseRatings = async function (hostelId, startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        hostelId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$mealType',
        avgRating: { $avg: '$overallRating' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { avgRating: -1 },
    },
  ]);
};

// Static method to get rating distribution
FeedbackSchema.statics.getRatingDistribution = async function (hostelId, startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        hostelId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$overallRating',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: -1 },
    },
  ]);
};

// Static method to get top issues/complaints
FeedbackSchema.statics.getTopIssues = async function (hostelId, startDate, endDate, limit = 10) {
  return await this.find({
    hostelId,
    date: { $gte: startDate, $lte: endDate },
    overallRating: { $lte: 3 },
  })
    .sort({ upvotes: -1, createdAt: -1 })
    .limit(limit)
    .populate('studentId', 'name registrationNumber')
    .select('date mealType overallRating comments tags upvotes status');
};

// Static method to get pending feedbacks
FeedbackSchema.statics.getPendingFeedbacks = async function (hostelId) {
  return await this.find({
    hostelId,
    status: 'pending',
  })
    .sort({ priority: -1, createdAt: 1 })
    .populate('studentId', 'name registrationNumber hostelId');
};

// Static method to get consolidated feedback report
FeedbackSchema.statics.getConsolidatedReport = async function (hostelId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const [avgRatings, mealWise, distribution, topIssues] = await Promise.all([
    this.getAverageRatings(hostelId, startDate, endDate),
    this.getMealWiseRatings(hostelId, startDate, endDate),
    this.getRatingDistribution(hostelId, startDate, endDate),
    this.getTopIssues(hostelId, startDate, endDate, 5),
  ]);
  
  return {
    period: { month, year, startDate, endDate },
    averageRatings: avgRatings,
    mealWiseRatings: mealWise,
    ratingDistribution: distribution,
    topIssues,
  };
};

export default mongoose.model('Feedback', FeedbackSchema);
