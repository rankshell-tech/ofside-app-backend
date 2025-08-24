import mongoose, { Schema, Document } from 'mongoose';
import { ICourt } from '../types';

export interface ICourtDocument extends Omit<ICourt, '_id'>, Document {}

const courtSchema = new Schema<ICourtDocument>({
  name: {
    type: String,
    required: [true, 'Court name is required'],
    trim: true,
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: [true, 'Venue is required'],
  },
  sportType: {
    type: String,
    required: [true, 'Sport type is required'],
  },
  surfaceType: {
    type: String,
  },
  size: {
    type: String,
  },
  isIndoor: {
    type: Boolean,
    default: false,
  },
  hasLighting: {
    type: Boolean,
    default: false,
  },
  images: {
    cover: { type: String, default: null },
    logo: { type: String, default: null },
    others: { type: [String], default: [] },
  },
  slotDuration: {
    type: Number,
  },
  maxPeople: {
    type: Number,
    required: [true, 'Max people is required'],
  },
  pricePerSlot: {
    type: Number,
    required: [true, 'Price per slot is required'],
  },
  peakEnabled: {
    type: Boolean,
    default: false,
  },
  peakDays: {
    type: [String],
    default: [], // Default peak days set to Saturday and Sunday
  },
  peakStart: {
    type: String,
  },
  peakEnd: {
    type: String,
  },
  peakPricePerSlot: {
    type: Number,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  days: {
    type: [Number],
    default: [],
  },
}, {
  timestamps: true,
});

// Indexes
courtSchema.index({ venue: 1 });
courtSchema.index({ sportType: 1 });
courtSchema.index({ isActive: 1 });

const Court = mongoose.model<ICourtDocument>('Court', courtSchema);
export default Court;