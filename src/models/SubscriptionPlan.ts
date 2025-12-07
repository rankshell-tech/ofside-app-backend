import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISubscriptionPlan {
  user: Types.ObjectId;
  plan: 'free' | 'elite' | 'pro';
  duration: '3months' | '1year';
  amount: number;
  currency: string;
  status: 'active' | 'expired' | 'cancelled';
  purchasedOn: Date;
  expiresOn?: Date;
  paymentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISubscriptionPlanDocument extends ISubscriptionPlan, Document {}

const subscriptionPlanSchema = new Schema<ISubscriptionPlanDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  plan: {
    type: String,
    enum: ['free', 'elite', 'pro'],
    required: [true, 'Plan is required'],
  },
  duration: {
    type: String,
    enum: ['3months', '1year'],
    required: [true, 'Duration is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  currency: {
    type: String,
    default: 'INR',
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
  },
  purchasedOn: {
    type: Date,
    default: Date.now,
  },
  expiresOn: {
    type: Date,
  },
  paymentId: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes
subscriptionPlanSchema.index({ user: 1 });
subscriptionPlanSchema.index({ status: 1 });
subscriptionPlanSchema.index({ plan: 1 });

const SubscriptionPlan = mongoose.model<ISubscriptionPlanDocument>('SubscriptionPlan', subscriptionPlanSchema);
export default SubscriptionPlan;

