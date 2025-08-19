import mongoose, { Schema, Document } from 'mongoose';
import { IPlayerStats } from '../types';

export interface IPlayerStatsDocument extends IPlayerStats, Document {}

const playerStatsSchema = new Schema<IPlayerStatsDocument>({
  player: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Player is required'],
  },
  match: {
    type: Schema.Types.ObjectId,
    ref: 'Match',
    required: [true, 'Match is required'],
  },
  sportType: {
    type: String,
    required: [true, 'Sport type is required'],
    enum: ['badminton', 'tennis', 'cricket', 'football', 'basketball', 'volleyball', 'table-tennis', 'squash'],
  },
  stats: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    scores: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    goals: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

// Indexes
playerStatsSchema.index({ player: 1 });
playerStatsSchema.index({ match: 1 });
playerStatsSchema.index({ sportType: 1 });

// Compound index to ensure one stat entry per player per match
playerStatsSchema.index({ player: 1, match: 1 }, { unique: true });

const PlayerStats = mongoose.model<IPlayerStatsDocument>('PlayerStats', playerStatsSchema);
export default PlayerStats;