import { Router } from 'express';
import {
  getCurrentSubscription,
  getUserSubscriptions,
  createSubscription,
  updateSubscriptionStatus,
} from '../controllers/subscriptionPlan.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Get current subscription for authenticated user
router.get('/current', authenticate, getCurrentSubscription);

// Get all subscriptions for authenticated user
router.get('/my-subscriptions', authenticate, getUserSubscriptions);

// Create a new subscription
router.post('/', authenticate, createSubscription);

// Update subscription status
router.patch('/:subscriptionId/status', authenticate, updateSubscriptionStatus);

export default router;

