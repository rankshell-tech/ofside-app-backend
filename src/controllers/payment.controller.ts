import { Response } from 'express';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
// Install razorpay: npm install razorpay
// @ts-ignore - Razorpay types
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

/**
 * @swagger
 * /api/payments/create-order:
 *   post:
 *     summary: Create a Razorpay order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount in paise (e.g., 10000 for ₹100)
 *               currency:
 *                 type: string
 *                 default: INR
 *               receipt:
 *                 type: string
 *                 description: Receipt ID for the order
 *               notes:
 *                 type: object
 *                 description: Additional notes/metadata
 *     responses:
 *       200:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { amount, currency = 'INR', receipt, notes } = req.body;

  // Validate required fields
  if (!amount || amount <= 0) {
    throw createError('Amount is required and must be greater than 0', 400);
  }

  // Validate Razorpay configuration
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw createError('Razorpay configuration missing. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET', 500);
  }

  try {
    // Create order options
    const options = {
      amount: Math.round(amount), // Amount in paise
      currency: currency.toUpperCase(),
      receipt: receipt || `venue_${Date.now()}_${req.user?.userId || 'unknown'}`,
      notes: {
        userId: req.user?.userId || '',
        ...notes,
      },
    };

    // Create order with Razorpay
    const order = await razorpay.orders.create(options);

    // Optionally save order to database (for tracking)
    try {
      await Payment.create({
        userId: req.user?.userId,
        orderId: order.id,
        paymentId: '', // Will be updated after payment
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: 'pending',
        metadata: {
          notes: notes || {},
        },
      });
    } catch (dbError) {
      // Log but don't fail the request if DB save fails
      console.error('Failed to save order to database:', dbError);
    }

    return res.status(200).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
      },
    });
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    throw createError(
      error.error?.description || 'Failed to create payment order',
      error.statusCode || 500
    );
  }
});

/**
 * @swagger
 * /api/payments/verify:
 *   post:
 *     summary: Verify Razorpay payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpay_order_id
 *               - razorpay_payment_id
 *               - razorpay_signature
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Invalid payment signature
 *       500:
 *         description: Server error
 */
export const verifyPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // Validate required fields
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw createError('Missing required payment verification fields', 400);
  }

  // Validate Razorpay configuration
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw createError('Razorpay configuration missing', 500);
  }

  try {
    // Create signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    // Verify signature
    if (generatedSignature !== razorpay_signature) {
      throw createError('Invalid payment signature', 400);
    }

    // Optionally fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    // Update payment record in database
    try {
      await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        {
          paymentId: razorpay_payment_id,
          status: payment.status === 'captured' ? 'completed' : 'failed',
          method: payment.method,
          razorpaySignature: razorpay_signature,
          metadata: {
            ...payment.notes,
            captured: payment.captured,
            email: payment.email,
            contact: payment.contact,
          },
        },
        { new: true, upsert: false }
      );
    } catch (dbError) {
      // Log but don't fail the request if DB update fails
      console.error('Failed to update payment in database:', dbError);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        createdAt: payment.created_at,
      },
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    throw createError(
      error.message || 'Payment verification failed',
      error.statusCode || 500
    );
  }
});

/**
 * @swagger
 * /api/payments/payment-details/{paymentId}:
 *   get:
 *     summary: Get payment details by payment ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 *       404:
 *         description: Payment not found
 */
export const getPaymentDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { paymentId } = req.params;

  if (!paymentId) {
    throw createError('Payment ID is required', 400);
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw createError('Razorpay configuration missing', 500);
  }

  try {
    const payment = await razorpay.payments.fetch(paymentId);

    return res.status(200).json({
      success: true,
      message: 'Payment details retrieved successfully',
      data: {
        paymentId: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        description: payment.description,
        createdAt: payment.created_at,
        captured: payment.captured,
        email: payment.email,
        contact: payment.contact,
      },
    });
  } catch (error: any) {
    console.error('Fetch payment error:', error);
    throw createError(
      error.error?.description || 'Failed to fetch payment details',
      error.statusCode || 404
    );
  }
});

