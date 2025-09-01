import mongoose, { Schema, Document } from 'mongoose';
import { IBooking } from '../types';

export interface IBookingDocument extends Omit<IBooking, '_id'>, Document {}

const bookingSchema = new Schema<IBookingDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  court: {
    type: Schema.Types.ObjectId,
    ref: 'Court',
    required: [true, 'Court is required'],
  },
  venue: {
    type: Schema.Types.ObjectId,
    ref: 'Venue',
    required: [true, 'Venue is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:mm format'],
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:mm format'],
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative'],
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed'],
    default: 'confirmed',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
  },
  paymentId: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes
bookingSchema.index({ user: 1 });
bookingSchema.index({ court: 1 });
bookingSchema.index({ venue: 1 });
bookingSchema.index({ date: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ status: 1 });

// Compound index to prevent overlapping bookings
bookingSchema.index({ court: 1, date: 1, startTime: 1, endTime: 1 });

const Booking = mongoose.model<IBookingDocument>('Booking', bookingSchema);
export default Booking;