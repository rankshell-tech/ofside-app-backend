import { Request, Response } from 'express';

// Extend Express Request type to include 'session'
declare module 'express-serve-static-core' {
  interface Request {
    session?: any;
  }
}
import { signupSchema, loginSchema, verifyOTPSchema } from '../utils/validators';
import { generateOTP, generateOTPExpiry } from '../utils/otp';
import { generateTokens, verifyRefreshToken, generateAccessToken } from '../utils/jwt';
import { sendEmailOTP, sendSMSOTP } from '../utils/notifications';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import User from '../models/User';
import OTP from '../models/OTP';

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = signupSchema.parse(req.body);

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { mobile: validatedData.mobile },
      ...(validatedData.email ? [{ email: validatedData.email }] : [])
    ]
  });

  if (existingUser) {
    throw createError('User already exists with this mobile or email', 400);
  }

  // Generate and save OTP, along with signup data
  const otp = generateOTP();
  const expiresAt = generateOTPExpiry();

  await OTP.create({
    identifier: validatedData.mobile,
    otp,
    type: 'signup',
    expiresAt,
    signupData: validatedData, // <-- Store signup data in OTP doc
  });

  // Only send OTP on email if email is provided
  if (validatedData.email) {
    await sendEmailOTP(validatedData.email, otp);
  }

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
    data: {
      identifier: validatedData.email || validatedData.mobile,
      sentTo: validatedData.email ? 'email' : 'none',
    },
  });
});


export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, otp, type } = verifyOTPSchema.parse(req.body);

  // Find and verify OTP
  const otpDoc = await OTP.findOne({
    identifier,
    otp,
    type,
    verified: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otpDoc) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP',
      data: null,
    });
  }

  let user;

  if (type === 'signup') {
    // Get signup data from OTP doc
    const signupData = otpDoc.signupData;
    if (!signupData) {
      return res.status(400).json({
        success: false,
        message: 'Signup data missing, please try again',
        data: null,
      });
    }

    user = await User.create({
      ...signupData,
      isActive: true,
    });
  } else {
    // Login existing user
    user = await User.findOne({
      $or: [
        { mobile: identifier },
        { email: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }
  }

  // Mark OTP as verified
  otpDoc.verified = true;
  await otpDoc.save();

  // Generate tokens
  const tokenPayload = {
    userId: user._id.toString(),
    mobile: user.mobile,
    role: user.role,
  };

  const tokens = generateTokens(tokenPayload);

  return res.status(200).json({
    success: true,
    message: type === 'signup' ? 'Account created successfully' : 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
      ...tokens,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { identifier } = loginSchema.parse(req.body);
  
  // Check if user exists
  const user = await User.findOne({
    $or: [
      { mobile: identifier },
      { email: identifier }
    ]
  });
  
  if (!user) {
    throw createError('User not found', 404);
  }
  
  if (!user.isActive) {
    throw createError('Account is not active', 400);
  }
  
  // Generate and save OTP
  const otp = generateOTP();
  const expiresAt = generateOTPExpiry();
  
  await OTP.create({
    identifier: user.email || user.mobile,
    otp,
    type: 'login',
    expiresAt,
  });
  
  // Only send OTP on email if user has email and identifier matches email
  if (user.email && identifier === user.email) {
    await sendEmailOTP(user.email, otp);
  }
  
  res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
    data: {
      identifier: user.email || user.mobile,
      sentTo: user.email && identifier === user.email ? 'email' : 'none',
    },
  });
});


export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw createError('Refresh token required', 400);
  }
  
  const decoded = verifyRefreshToken(refreshToken);
  
  // Verify user still exists
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    throw createError('User not found or inactive', 404);
  }
  
  // Generate new access token
  const tokenPayload = {
    userId: user._id.toString(),
    mobile: user.mobile,
    role: user.role,
  };
  
  const accessToken = generateAccessToken(tokenPayload);
  
  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: { accessToken },
  });
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?.userId).select('-__v');
  
  if (!user) {
    throw createError('User not found', 404);
  }
  
  res.status(200).json({
    success: true,
    data: { user },
  });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const allowedFields = ['name', 'email', 'profilePicture'];
  const updates = Object.keys(req.body)
    .filter(key => allowedFields.includes(key))
    .reduce((obj: any, key) => {
      obj[key] = req.body[key];
      return obj;
    }, {});
  
  if (Object.keys(updates).length === 0) {
    throw createError('No valid fields to update', 400);
  }
  
  const user = await User.findByIdAndUpdate(
    req.user?.userId,
    updates,
    { new: true, runValidators: true }
  ).select('-__v');
  
  if (!user) {
    throw createError('User not found', 404);
  }
  
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
});

export const resendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, type } = verifyOTPSchema.pick({ identifier: true, type: true }).parse(req.body);

  // Find the latest OTP doc for this identifier and type
  const otpDoc = await OTP.findOne({
    identifier,
    type,
    verified: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  // If there's an unexpired OTP, reuse it; otherwise, generate a new one
  let otp: string;
  let expiresAt: Date;

  if (otpDoc) {
    otp = otpDoc.otp;
    expiresAt = otpDoc.expiresAt;
  } else {
    otp = generateOTP();
    expiresAt = generateOTPExpiry();

    // For signup, preserve signupData if present in previous OTP
    let signupData = undefined;
    if (type === 'signup') {
      const prevOTP = await OTP.findOne({ identifier, type }).sort({ createdAt: -1 });
      signupData = prevOTP?.signupData;
    }

    await OTP.create({
      identifier,
      otp,
      type,
      expiresAt,
      ...(signupData ? { signupData } : {}),
    });
  }

  // Send OTP via email if identifier is an email
  if (identifier.includes('@')) {
    await sendEmailOTP(identifier, otp);
    res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      data: { identifier, sentTo: 'email' },
    });
  } else {
    // Optionally, send via SMS if you support it
    await sendSMSOTP(identifier, otp);
    res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      data: { identifier, sentTo: 'sms' },
    });
  }
});