import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  getPaymentDetails,
} from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management endpoints
 */

/**
 * @swagger
 * /api/payments/create-order:
 *   post:
 *     summary: Create a Razorpay order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/create-order', authenticate, createOrder);

/**
 * @swagger
 * /api/payments/verify:
 *   post:
 *     summary: Verify Razorpay payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/verify', authenticate, verifyPayment);

/**
 * @swagger
 * /api/payments/payment-details/{paymentId}:
 *   get:
 *     summary: Get payment details by payment ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/payment-details/:paymentId', authenticate, getPaymentDetails);

export default router;

