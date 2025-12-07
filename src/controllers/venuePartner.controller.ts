import { Request, Response } from 'express';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import Venue from '../models/Venue';
import Booking from '../models/Booking';
import Court from '../models/Court';
import User from '../models/User';
import { Types } from 'mongoose';
import mongoose from 'mongoose';

// Get venue partner dashboard analytics
export const getVenuePartnerDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  // Get all venues owned by the user
  const venues = await Venue.find({ createdBy: userId }).select('_id venueName');
  const venueIds = venues.map(v => v._id);

  if (venueIds.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        venues: [],
        analytics: {
          totalBookings: 0,
          totalRevenue: 0,
          totalUsers: 0,
        },
        recentBookings: [],
      },
    });
  }

  // Parse date filters
  const { period, fromDate, toDate } = req.query;
  let dateFilter: any = {};

  if (period === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateFilter = { date: { $gte: today, $lt: tomorrow } };
  } else if (period === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    dateFilter = { date: { $gte: weekAgo } };
  } else if (period === 'month') {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    monthAgo.setHours(0, 0, 0, 0);
    dateFilter = { date: { $gte: monthAgo } };
  } else if (fromDate || toDate) {
    dateFilter = {};
    if (fromDate) {
      dateFilter.$gte = new Date(fromDate as string);
    }
    if (toDate) {
      const to = new Date(toDate as string);
      to.setHours(23, 59, 59, 999);
      dateFilter.$lte = to;
    }
    if (Object.keys(dateFilter).length > 0) {
      dateFilter = { date: dateFilter };
    }
  }

  // Get analytics
  const analyticsMatch: any = { venue: { $in: venueIds } };
  if (dateFilter && Object.keys(dateFilter).length > 0) {
    if (dateFilter.date) {
      analyticsMatch.date = dateFilter.date;
    } else {
      analyticsMatch.date = dateFilter;
    }
  }

  // Total bookings
  const totalBookings = await Booking.countDocuments(analyticsMatch);

  // Total revenue (from completed/confirmed bookings with paid status)
  const revenueResult = await Booking.aggregate([
    { $match: { ...analyticsMatch, paymentStatus: { $in: ['paid'] } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const totalRevenue = revenueResult[0]?.total || 0;

  // Total unique users
  const usersResult = await Booking.aggregate([
    { $match: analyticsMatch },
    { $group: { _id: '$user' } },
    { $count: 'total' },
  ]);
  const totalUsers = usersResult[0]?.total || 0;

  // Get recent bookings
  const recentBookings = await Booking.find(analyticsMatch)
    .populate('user', 'name mobile')
    .populate('court', 'name sportType')
    .populate('venue', 'venueName location')
    .sort({ date: -1, startTime: -1 })
    .limit(20)
    .lean();

  // Format bookings for frontend
  const formattedBookings = recentBookings.map((booking: any) => {
    const venue = booking.venue || {};
    const location = venue.location || {};
    const address = location.address || location.city || 'N/A';
    
    return {
      id: booking._id.toString(),
      bookingId: booking._id.toString().substring(0, 8).toUpperCase(),
      name: booking.user?.name || 'Unknown',
      number: booking.user?.mobile || 'N/A',
      courtName: booking.court?.name || 'Unknown Court',
      sportType: booking.court?.sportType || 'Unknown',
      venueName: venue.venueName || 'Unknown Venue',
      location: address,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      price: booking.totalPrice,
      payment: booking.paymentStatus === 'paid' ? 'Paid' : booking.paymentStatus === 'pending' ? 'Partial' : 'Pending',
      paymentStatus: booking.status === 'completed' ? 'Completed' : booking.status === 'confirmed' ? 'Confirmed' : 'Cancelled',
      status: booking.status,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      venues: venues.map(v => ({ id: v._id.toString(), name: v.venueName })),
      analytics: {
        totalBookings,
        totalRevenue,
        totalUsers,
      },
      recentBookings: formattedBookings,
    },
  });
});

// Get all bookings for all venues owned by the user
export const getAllVenuePartnerBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  // Get all venues owned by the user
  const venues = await Venue.find({ createdBy: userId }).select('_id');
  const venueIds = venues.map(v => v._id);

  if (venueIds.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        bookings: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
      },
    });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;

  const filters: any = { venue: { $in: venueIds } };

  // Filter by status
  let minDate: Date | null = null;
  if (req.query.status) {
    const status = req.query.status as string;
    // Map frontend status to backend status
    if (status === 'upcoming') {
      filters.status = 'confirmed';
      // Also filter to only show future bookings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      minDate = today;
    } else {
      filters.status = status;
    }
  }

  // Filter by date range
  if (req.query.fromDate || req.query.toDate || minDate) {
    filters.date = {};
    if (req.query.fromDate) {
      const fromDate = new Date(req.query.fromDate as string);
      minDate = minDate ? new Date(Math.max(minDate.getTime(), fromDate.getTime())) : fromDate;
    }
    if (minDate) {
      filters.date.$gte = minDate;
    }
    if (req.query.toDate) {
      const to = new Date(req.query.toDate as string);
      to.setHours(23, 59, 59, 999);
      filters.date.$lte = to;
    }
  }

  const bookings = await Booking.find(filters)
    .populate('user', 'name mobile')
    .populate('court', 'name sportType')
    .populate('venue', 'venueName location')
    .sort({ date: -1, startTime: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Booking.countDocuments(filters);

  // Format bookings for frontend
  const formattedBookings = bookings.map((booking: any) => {
    const venue = booking.venue || {};
    const location = venue.location || {};
    const address = location.address || location.city || 'N/A';
    
    return {
      id: booking._id.toString(),
      bookingId: booking._id.toString().substring(0, 8).toUpperCase(),
      name: booking.user?.name || 'Unknown',
      number: booking.user?.mobile || 'N/A',
      courtName: booking.court?.name || 'Unknown Court',
      sportType: booking.court?.sportType || 'Unknown',
      venueName: venue.venueName || 'Unknown Venue',
      location: address,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      price: booking.totalPrice,
      payment: booking.paymentStatus === 'paid' ? 'Paid' : booking.paymentStatus === 'pending' ? 'Partial' : 'Pending',
      paymentStatus: booking.status === 'completed' ? 'Completed' : booking.status === 'confirmed' ? 'Confirmed' : 'Cancelled',
      status: booking.status,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      bookings: formattedBookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// Create manual booking by venue partner
export const createManualBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  const { customerName, customerEmail, customerMobile, courtId, date, startTime, endTime, paymentStatus, amount } = req.body;

  // Validate required fields
  if (!customerName || !customerMobile || !courtId || !date || !startTime || !endTime) {
    throw createError('Missing required fields', 400);
  }

  // Check if court exists and belongs to a venue owned by the user
  const court = await Court.findById(courtId).populate('venue');
  if (!court || !court.isActive) {
    throw createError('Court not found or inactive', 404);
  }

  const venue = court.venue as any;
  if (req.user?.role !== 2 && venue.createdBy.toString() !== userId) {
    throw createError('Not authorized to create bookings for this court', 403);
  }

  // Find or create customer user
  let customerUser = await User.findOne({
    $or: [
      { mobile: customerMobile },
      ...(customerEmail ? [{ email: customerEmail }] : []),
    ],
  });

  if (!customerUser) {
    const userData: Record<string, any> = { mobile: customerMobile, name: customerName };
    if (customerEmail) userData.email = customerEmail;
    customerUser = await User.create(userData);
  } else {
    // Update user details if provided
    if (customerName && customerUser.name !== customerName) {
      customerUser.name = customerName;
    }
    if (customerEmail && customerUser.email !== customerEmail) {
      customerUser.email = customerEmail;
    }
    await customerUser.save();
  }

  // Helper to parse time to minutes
  const timeToMinutes = (t: string) => {
    const [hh = '0', mm = '0'] = (t || '').split(':');
    const h = Number(hh);
    const m = Number(mm);
    if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
    return h * 60 + m;
  };

  const bookingDate = new Date(date);
  bookingDate.setHours(0, 0, 0, 0);

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) {
    throw createError('Invalid startTime or endTime format. Use HH:mm', 400);
  }
  if (endMinutes <= startMinutes) {
    throw createError('endTime must be after startTime', 400);
  }

  // Check for overlapping bookings
  const session = await mongoose.startSession();
  try {
    let createdBooking: any = null;

    await session.withTransaction(async () => {
      const bookingsOnDate = await Booking.find({
        court: courtId,
        date: bookingDate,
        status: 'confirmed',
      }).session(session);

      const hasOverlap = bookingsOnDate.some((b) => {
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        return bStart < endMinutes && bEnd > startMinutes;
      });

      if (hasOverlap) {
        throw createError('Court is already booked for this time slot', 400);
      }

      // Calculate total price
      let totalPrice = Number(court.pricePerSlot || 0);

      // Check for peak pricing
      if (court.peakEnabled) {
        const dayOfWeek = bookingDate.getDay();
        const isPeakDay = Array.isArray(court.peakDays) ? court.peakDays.includes(dayOfWeek) : false;
        const peakStartMinutes = court.peakStart ? timeToMinutes(court.peakStart) : 0;
        const peakEndMinutes = court.peakEnd ? timeToMinutes(court.peakEnd) : 0;
        const isPeakTime = startMinutes >= peakStartMinutes && endMinutes <= peakEndMinutes;

        if (isPeakDay && isPeakTime) {
          totalPrice = Number(court.peakPricePerSlot || court.pricePerSlot || 0);
        }
      }

      const slotDuration = Number(court.slotDuration || 60);
      const durationMinutes = endMinutes - startMinutes;
      const slots = Math.ceil(durationMinutes / (slotDuration || 60));
      totalPrice = totalPrice * slots;

      // Use provided amount if given, otherwise use calculated price
      const finalAmount = amount ? Number(amount) : totalPrice;

      // Create booking
      createdBooking = await Booking.create(
        [{
          user: customerUser._id,
          court: courtId,
          venue: venue._id,
          date: bookingDate,
          startTime,
          endTime,
          totalPrice: finalAmount,
          paymentStatus: paymentStatus || 'pending',
        }],
        { session }
      );

      if (Array.isArray(createdBooking)) createdBooking = createdBooking[0];
    });

    // Populate booking for response
    const populatedBooking = await Booking.findById(createdBooking._id)
      .populate('user', 'name mobile email')
      .populate('court', 'name sportType')
      .populate('venue', 'venueName');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking: populatedBooking },
    });
  } finally {
    session.endSession();
  }
});

// Get bookings for a specific venue
export const getVenueBookingsForPartner = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { venueId } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  // Verify venue ownership
  const venue = await Venue.findById(venueId);
  if (!venue) {
    throw createError('Venue not found', 404);
  }

  // Allow if user is admin, or if user created the venue
  if (req.user?.role !== 2 && venue.createdBy.toString() !== userId) {
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
      const to = new Date(req.query.toDate as string);
      to.setHours(23, 59, 59, 999);
      filters.date.$lte = to;
    }
  }

  const bookings = await Booking.find(filters)
    .populate('user', 'name mobile')
    .populate('court', 'name sportType')
    .sort({ date: -1, startTime: -1 })
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
