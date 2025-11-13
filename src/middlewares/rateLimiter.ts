import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs ?? 15 * 60 * 1000, // default to 15 minutes
  max: config.rateLimit.maxRequests ?? 100, // default to 100 requests
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 OTP requests per minute
  message: {
    success: false,
    message: 'Too many OTP requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});