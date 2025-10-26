import mongoose, { Schema, Document } from 'mongoose';
import { IVenue } from '../types';

export interface IVenueDocument extends Omit<IVenue, '_id'>, Document {}

const venueSchema = new Schema<IVenueDocument>({
  venueName: {
    type: String,
    required: [true, 'Venue name is required'],
    trim: true,
    maxlength: [200, 'Venue name cannot exceed 200 characters'],
  },
  venueType: {
    type: String,
  },
  sportsOffered: [{
    type: String,
  }],
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  amenities: [{
    type: String,
  }],
  is24HoursOpen: {
    type: Boolean,
    default: false,
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    country: {
      type: String,
      default: "India",
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode'],
    },
    coordinates: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], index: "2dsphere" },
    },
  },
  contact: {
    name: {
      type: String,
      required: [true, 'Contact person name is required'],
    },
    phone: {
      type: String,
      required: [true, 'Contact person phone is required'],
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
    },
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
  },
  owner: {
    name: { type: String },
    phone: { type: String },
    email: { type: String }
  },
  courts: [{
    type: Schema.Types.ObjectId,
    ref: 'Court',
  }],
  declarationAgreed: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isTrending: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  pendingChanges: { type: Schema.Types.Mixed, default: null },
  rawVenueData: { type: Schema.Types.Mixed, default: null },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
  },
}, {
  timestamps: true,
});

// Indexes
venueSchema.index({ createdBy: 1 });
venueSchema.index({ 'location.coordinates': '2dsphere' });
venueSchema.index({ sportsOffered: 1 });
venueSchema.index({ isActive: 1 });
venueSchema.index({ isVerified: 1 });

const Venue = mongoose.model<IVenueDocument>('Venue', venueSchema);
export default Venue;