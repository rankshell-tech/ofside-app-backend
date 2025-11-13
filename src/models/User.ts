import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../types';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: [50, 'Username cannot exceed 50 characters'],
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number'],
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  referralCode: {
    type: String,
    trim: true,
    uppercase: true,
  },
  role: {
    type: Number,
    enum: [0, 1, 2],
    default: 0, // 0: user, 1: venue owner, 2: admin
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  profilePicture: {
    type: String,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: false,
  },
  favSports: {
    type: [String],
    default: [],
  },
  dateOfBirth: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
userSchema.index({ mobile: 1 });
userSchema.index({ email: 1 });

const User = mongoose.model<IUserDocument>('User', userSchema);
export default User;