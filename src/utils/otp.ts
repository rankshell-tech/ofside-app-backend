import crypto from 'crypto';
import { config } from '../config/env';

export const generateOTP = (length: number = 4): string => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    otp += digits[randomIndex];
  }
  
  return otp;
};

export const generateOTPExpiry = (): Date => {
  const now = new Date();
  const expiryMinutes = config.otp.expiryMinutes ?? 5; // default to 5 minutes if undefined
  return new Date(now.getTime() + expiryMinutes * 60 * 1000);
};

export const isValidOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};