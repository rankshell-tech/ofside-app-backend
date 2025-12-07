import { Request, Response } from 'express';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import SubscriptionPlan from '../models/SubscriptionPlan';
import User from '../models/User';

// Get current subscription plan for authenticated user
export const getCurrentSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  // Get the most recent active subscription
  const subscription = await SubscriptionPlan.findOne({
    user: userId,
    status: 'active',
  })
    .sort({ purchasedOn: -1 })
    .populate('user', 'name plan');

  // Get user's current plan
  const user = await User.findById(userId).select('plan');

  res.status(200).json({
    success: true,
    data: {
      subscription: subscription || null,
      currentPlan: user?.plan || 'free',
    },
  });
});

// Get all subscriptions for a user
export const getUserSubscriptions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  const subscriptions = await SubscriptionPlan.find({ user: userId })
    .sort({ purchasedOn: -1 })
    .populate('user', 'name plan');

  res.status(200).json({
    success: true,
    data: { subscriptions },
  });
});

// Create a new subscription plan
export const createSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { plan, duration, amount, currency, paymentId, expiresOn } = req.body;

  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  if (!plan || !duration || !amount) {
    throw createError('Plan, duration, and amount are required', 400);
  }

  // Deactivate previous active subscriptions
  await SubscriptionPlan.updateMany(
    { user: userId, status: 'active' },
    { status: 'expired' }
  );

  // Create new subscription
  const subscription = await SubscriptionPlan.create({
    user: userId,
    plan,
    duration,
    amount,
    currency: currency || 'INR',
    status: 'active',
    paymentId,
    expiresOn,
    purchasedOn: new Date(),
  });

  // Update user's plan
  await User.findByIdAndUpdate(userId, { plan });

  res.status(201).json({
    success: true,
    message: 'Subscription created successfully',
    data: { subscription },
  });
});

// Update subscription status
export const updateSubscriptionStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { subscriptionId } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'expired', 'cancelled'].includes(status)) {
    throw createError('Valid status is required', 400);
  }

  const subscription = await SubscriptionPlan.findById(subscriptionId);

  if (!subscription) {
    throw createError('Subscription not found', 404);
  }

  // Check if user owns this subscription
  if (subscription.user.toString() !== req.user?.userId && req.user?.role !== 9) {
    throw createError('Not authorized to update this subscription', 403);
  }

  subscription.status = status;
  await subscription.save();

  res.status(200).json({
    success: true,
    message: 'Subscription status updated successfully',
    data: { subscription },
  });
});

