import mongoose, { Schema, Document } from 'mongoose';
import { IMatch } from '../types';

export interface IMatchDocument extends Omit<IMatch, '_id'>, Document {}

const matchSchema = new Schema<IMatchDocument>({
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
  sportType: {
    type: String,
    required: [true, 'Sport type is required'],
    enum: ['badminton', 'tennis', 'cricket', 'football', 'basketball', 'volleyball', 'table-tennis', 'squash'],
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
  players: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  score: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

// Indexes
matchSchema.index({ court: 1 });
matchSchema.index({ venue: 1 });
matchSchema.index({ sportType: 1 });
matchSchema.index({ date: 1, startTime: 1 });
matchSchema.index({ players: 1 });
matchSchema.index({ status: 1 });

const Match = mongoose.model<IMatchDocument>('Match', matchSchema);
export default Match;