import { Request, Response } from 'express';
import { bookingSchema } from '../utils/validators';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import { sendBookingConfirmation } from '../utils/notifications';
import Booking from '../models/Booking';
import Court from '../models/Court';
import Venue from '../models/Venue';
import User from '../models/User';

export const createBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = bookingSchema.parse(req.body);
  
  // Check if court exists
  const court = await Court.findById(validatedData.courtId).populate('venue');
  if (!court || !court.isActive) {
    throw createError('Court not found or inactive', 404);
  }
  
  const venue = court.venue as any;
  
  // Check for overlapping bookings
  const overlappingBooking = await Booking.findOne({
    court: validatedData.courtId,
    date: new Date(validatedData.date),
    status: 'confirmed',
    $or: [
      {
        startTime: { $lt: validatedData.endTime },
        endTime: { $gt: validatedData.startTime },
      },
    ],
  });
  
  if (overlappingBooking) {
    throw createError('Court is already booked for this time slot', 400);
  }
  
  // Calculate total price
  const startTime = validatedData.startTime;
  const endTime = validatedData.endTime;
  const bookingDate = new Date(validatedData.date);
  
  let totalPrice = court.pricePerSlot;
  
  // Check for peak hours
  if (court.peakHours?.enabled) {
    const dayOfWeek = bookingDate.getDay();
    const isPeakDay = court.peakHours.days?.includes(dayOfWeek);
    const isPeakTime = startTime >= court.peakHours.startTime! && endTime <= court.peakHours.endTime!;
    
    if (isPeakDay && isPeakTime) {
      totalPrice = court.peakHours.peakPricePerSlot || court.pricePerSlot;
    }
  }
  
  // Calculate duration and multiply price
  const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
  const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
  const durationMinutes = endMinutes - startMinutes;
  const slots = Math.ceil(durationMinutes / court.slotDuration);
  
  totalPrice *= slots;
  
  // Create booking
  const booking = await Booking.create({
    user: req.user?.userId,
    court: validatedData.courtId,
    venue: venue._id,
    date: bookingDate,
    startTime,
    endTime,
    totalPrice,
  });
  
  // Get user details for notification
  const user = await User.findById(req.user?.userId);
  
  // Send confirmation notification
  if (user) {
    const bookingDetails = {
      venueName: venue.venueName,
      courtName: court.courtName,
      date: validatedData.date,
      time: `${startTime} - ${endTime}`,
      amount: totalPrice,
    };
    
    if (user.email) {
      await sendBookingConfirmation(user.email, 'email', bookingDetails);
    }
    await sendBookingConfirmation(user.mobile, 'sms', bookingDetails);
  }
  
  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: { booking },
  });
});

export const getUserBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  
  const filters: any = { user: req.user?.userId };
  
  // Filter by status
  if (req.query.status) {
    filters.status = req.query.status;
  }
  
  // Filter by date range
  if (req.query.fromDate || req.query.toDate) {
    filters.date = {};
    if (req.query.fromDate) {
      filters.date.$gte = new Date(req.query.fromDate as string);
    }
    if (req.query.toDate) {
      filters.date.$lte = new Date(req.query.toDate as string);
    }
  }
  
  const bookings = await Booking.find(filters)
    .populate('court', 'courtName sportType')
    .populate('venue', 'venueName address')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Booking.countDocuments(filters);
  
  res.status(200).json({
    success: true,
    data: {
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const getBookingById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const booking = await Booking.findById(req.params.id)
    .populate('user', 'name mobile email')
    .populate('court', 'courtName sportType')
    .populate('venue', 'venueName address contactPerson');
  
  if (!booking) {
    throw createError('Booking not found', 404);
  }
  
  // Check authorization (users can see their bookings, venue owners can see bookings for their venues, admins can see all)
  const venue = booking.venue as any;
  if (
    req.user?.role === 0 && booking.user.toString() !== req.user?.userId || // Users can only see their bookings
    req.user?.role === 1 && venue.owner.toString() !== req.user?.userId || // Owners can only see their venue bookings
    req.user?.role === 2 // Admins can see all
  ) {
    // Additional check for venue owners
    if (req.user?.role === 1) {
      const venueDoc = await Venue.findById(venue._id);
      if (venueDoc?.owner.toString() !== req.user?.userId) {
        throw createError('Not authorized to view this booking', 403);
      }
    } else if (req.user?.role !== 2) {
      throw createError('Not authorized to view this booking', 403);
    }
  }
  
  res.status(200).json({
    success: true,
    data: { booking },
  });
});

export const cancelBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    throw createError('Booking not found', 404);
  }
  
  // Check authorization (users can cancel their bookings, venue owners can cancel bookings for their venues, admins can cancel any)
  if (req.user?.role === 0 && booking.user.toString() !== req.user?.userId) {
    throw createError('Not authorized to cancel this booking', 403);
  }
  
  if (req.user?.role === 1) {
    const venue = await Venue.findById(booking.venue);
    if (venue?.owner.toString() !== req.user?.userId) {
      throw createError('Not authorized to cancel this booking', 403);
    }
  }
  
  if (booking.status === 'cancelled') {
    throw createError('Booking is already cancelled', 400);
  }
  
  if (booking.status === 'completed') {
    throw createError('Cannot cancel completed booking', 400);
  }
  
  // Check if booking can be cancelled (e.g., at least 2 hours before)
  const bookingDateTime = new Date(booking.date);
  const [hours, minutes] = booking.startTime.split(':').map(Number);
  bookingDateTime.setHours(hours, minutes);
  
  const now = new Date();
  const timeDiff = bookingDateTime.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  if (hoursDiff < 2) {
    throw createError('Bookings can only be cancelled at least 2 hours in advance', 400);
  }
  
  booking.status = 'cancelled';
  await booking.save();
  
  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: { booking },
  });
});

export const getVenueBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { venueId } = req.params;
  
  // Check if user owns the venue
  const venue = await Venue.findById(venueId);
  if (!venue) {
    throw createError('Venue not found', 404);
  }
  
  if (req.user?.role !== 2 && venue.owner.toString() !== req.user?.userId) {
    throw createError('Not authorized to view bookings for this venue', 403);
  }
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  
  const filters: any = { venue: venueId };
  
  // Filter by status
  if (req.query.status) {
    filters.status = req.query.status;
  }
  
  // Filter by date range
  if (req.query.fromDate || req.query.toDate) {
    filters.date = {};
    if (req.query.fromDate) {
      filters.date.$gte = new Date(req.query.fromDate as string);
    }
    if (req.query.toDate) {
      filters.date.$lte = new Date(req.query.toDate as string);
    }
  }
  
  const bookings = await Booking.find(filters)
    .populate('user', 'name mobile')
    .populate('court', 'courtName sportType')
    .sort({ date: -1, startTime: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Booking.countDocuments(filters);
  
  // Calculate revenue
  const revenue = await Booking.aggregate([
    { $match: { venue: venue._id, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      bookings,
      revenue: revenue[0]?.total || 0,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});