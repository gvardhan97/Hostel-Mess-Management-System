import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { HOSTELS, ROLES } from '../constants/index.js';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'student',
    },
    registrationNumber: {
      type: String,
      sparse: true,
      unique: true,
    },
    hostelId: {
      type: String,
      enum: HOSTELS,
      required: function() {
        return this.role === 'student' || this.role === 'manager';
      },
    },
    contactNumber: {
      type: String,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit contact number'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', UserSchema);
