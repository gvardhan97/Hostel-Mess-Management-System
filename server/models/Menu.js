import mongoose from 'mongoose';

// Sub-schema for individual meal items
const MealItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Meal item name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['main_course', 'side_dish', 'beverage', 'dessert', 'snack'],
      default: 'main_course',
    },
    isVegetarian: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

// Sub-schema for each meal type
const MealSchema = new mongoose.Schema(
  {
    breakfast: {
      items: [MealItemSchema],
      timings: {
        type: String,
        default: '07:30 AM - 09:30 AM',
      },
    },
    lunch: {
      items: [MealItemSchema],
      timings: {
        type: String,
        default: '12:30 PM - 02:30 PM',
      },
    },
    dinner: {
      items: [MealItemSchema],
      timings: {
        type: String,
        default: '07:30 PM - 09:30 PM',
      },
    },
  },
  { _id: false }
);

// Sub-schema for daily menu
const DailyMenuSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    meals: {
      type: MealSchema,
      required: true,
    },
    specialNotes: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

// Main Menu Schema
const MenuSchema = new mongoose.Schema(
  {
    hostelId: {
      type: String,
      required: [true, 'Hostel ID is required'],
      index: true,
    },
    weekStartDate: {
      type: Date,
      required: [true, 'Week start date is required'],
    },
    weekEndDate: {
      type: Date,
      required: [true, 'Week end date is required'],
    },
    weekNumber: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    dailyMenus: {
      type: [DailyMenuSchema],
      validate: {
        validator: function (menus) {
          return menus.length === 7;
        },
        message: 'Weekly menu must contain exactly 7 days',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    announcement: {
      type: String,
      trim: true,
      maxlength: [500, 'Announcement cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
MenuSchema.index({ hostelId: 1, weekStartDate: 1 });
MenuSchema.index({ hostelId: 1, status: 1, isActive: 1 });
MenuSchema.index({ weekStartDate: 1, weekEndDate: 1 });

// Validate that weekEndDate is after weekStartDate
MenuSchema.pre('save', function (next) {
  if (this.weekEndDate <= this.weekStartDate) {
    next(new Error('Week end date must be after week start date'));
  }
  next();
});

// Automatically set publishedAt when status changes to 'published'
MenuSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Method to get menu for a specific day
MenuSchema.methods.getMenuForDay = function (dayName) {
  return this.dailyMenus.find((menu) => menu.day === dayName);
};

// Method to get menu for a specific date
MenuSchema.methods.getMenuForDate = function (date) {
  const targetDate = new Date(date).toDateString();
  return this.dailyMenus.find((menu) => new Date(menu.date).toDateString() === targetDate);
};

// Static method to get current week menu for a mess
MenuSchema.statics.getCurrentWeekMenu = async function (hostelId) {
  const today = new Date();
  return await this.findOne({
    hostelId,
    weekStartDate: { $lte: today },
    weekEndDate: { $gte: today },
    status: 'published',
    isActive: true,
  }).populate('createdBy', 'name email');
};

// Static method to get upcoming menu
MenuSchema.statics.getUpcomingMenu = async function (hostelId) {
  const today = new Date();
  return await this.findOne({
    hostelId,
    weekStartDate: { $gt: today },
    status: 'published',
    isActive: true,
  })
    .sort({ weekStartDate: 1 })
    .populate('createdBy', 'name email');
};

// Static method to archive old menus
MenuSchema.statics.archiveOldMenus = async function () {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return await this.updateMany(
    {
      weekEndDate: { $lt: oneWeekAgo },
      status: 'published',
    },
    {
      $set: { status: 'archived', isActive: false },
    }
  );
};

export default mongoose.model('Menu', MenuSchema);
