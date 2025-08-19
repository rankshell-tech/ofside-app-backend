import mongoose, { Schema, Document } from 'mongoose';
import { IOTP } from '../types';

export interface IOTPDocument extends Omit<IOTP, '_id'>, Document {}

const otpSchema = new Schema<IOTPDocument>({
  identifier: {
    type: String,
    required: [true, 'Identifier (mobile/email) is required'],
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
  },
  type: {
    type: String,
    enum: ['signup', 'login'],
    required: [true, 'OTP type is required'],
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiry time is required'],
    index: { expireAfterSeconds: 0 },
  },
  verified: {
    type: Boolean,
    default: false,
  },
  signupData: { type: Schema.Types.Mixed }, 
}, {
  timestamps: true,
});

// Indexes
otpSchema.index({ identifier: 1, type: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model<IOTPDocument>('OTP', otpSchema);
export default OTP;


