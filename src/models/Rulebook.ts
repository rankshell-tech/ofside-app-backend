import mongoose, { Schema, Document } from 'mongoose';
import { IRulebook } from '../types';

export interface IRulebookDocument extends Omit<IRulebook, '_id'>, Document {}

const rulebookSchema = new Schema<IRulebookDocument>({
  sportType: {
    type: String,
    required: [true, 'Sport type is required'],
    unique: true,
  },
  rules: {
    type: String,
    required: [true, 'Rules are required'],
    trim: true,
  },
}, {
  timestamps: true,
});

// Indexes
rulebookSchema.index({ sportType: 1 });

const Rulebook = mongoose.model<IRulebookDocument>('Rulebook', rulebookSchema);
export default Rulebook;
