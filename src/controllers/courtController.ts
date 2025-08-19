import { Request, Response } from 'express';
import { courtSchema } from '../utils/validators';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import Court from '../models/Court';
import Venue from '../models/Venue';

export const createCourt = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = courtSchema.parse(req.body);

  // Check if venue exists and user owns it
  const venue = await Venue.findById(validatedData.venue);
  if (!venue) {
    throw createError('Venue not found', 404);
  }

  if (
    req.user?.role !== 2 &&
    (!venue.owner || venue.owner.toString() !== req.user?.userId)
  ) {
    throw createError('Not authorized to create courts for this venue', 403);
  }

  // Map Zod validated data to Mongoose model fields
  const mappedData = {
    name: validatedData.courtName,
    venue: validatedData.venue,
    sportType: validatedData.sportType,
    surfaceType: validatedData.surfaceType,
    size: validatedData.size,
    isIndoor: validatedData.isIndoor ?? false,
    hasLighting: validatedData.hasLighting ?? false,
    images: validatedData.images || {
      cover: null,
      logo: null,
      others: [],
    },
    slotDuration: validatedData.slotDuration,
    maxPeople: validatedData.maxPeople,
    pricePerSlot: validatedData.pricePerSlot,
    peakEnabled: validatedData.peakHours?.enabled ?? false,
    peakDays: validatedData.peakHours?.days ?? [],
    peakStart: validatedData.peakHours?.startTime,
    peakEnd: validatedData.peakHours?.endTime,
    peakPricePerSlot: validatedData.peakHours?.peakPricePerSlot,
    isActive: true,
    days: validatedData.days ?? [],
  };

  // Create court
  const court = await Court.create(mappedData);

  // Add court to venue
  venue.courts.push(court._id.toString());
  await venue.save();

  res.status(201).json({
    success: true,
    message: 'Court created successfully',
    data: { court },
  });
});


export const getCourts = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  
  const filters: any = {};
  
  // Filter by venue
  if (req.query.venue) {
    filters.venue = req.query.venue;
  }
  
  // Filter by sport type
  if (req.query.sportType) {
    filters.sportType = req.query.sportType;
  }
  
  // Filter by active status
  if (req.query.isActive !== undefined) {
    filters.isActive = req.query.isActive === 'true';
  }
  
  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    filters.pricePerSlot = {};
    if (req.query.minPrice) {
      filters.pricePerSlot.$gte = parseFloat(req.query.minPrice as string);
    }
    if (req.query.maxPrice) {
      filters.pricePerSlot.$lte = parseFloat(req.query.maxPrice as string);
    }
  }
  
  const courts = await Court.find(filters)
    .populate('venue', 'venueName address contactPerson')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Court.countDocuments(filters);
  
  res.status(200).json({
    success: true,
    data: {
      courts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const getCourtById = asyncHandler(async (req: Request, res: Response) => {
  const court = await Court.findById(req.params.id)
    .populate('venue', 'venueName address contactPerson amenities');
  
  if (!court) {
    throw createError('Court not found', 404);
  }
  
  res.status(200).json({
    success: true,
    data: { court },
  });
});

export const updateCourt = asyncHandler(async (req: AuthRequest, res: Response) => {
  const court = await Court.findById(req.params.id).populate('venue');
  
  if (!court) {
    throw createError('Court not found', 404);
  }
  
  // Check ownership
  if (req.user?.role !== 2 && (court.venue as any).owner.toString() !== req.user?.userId) {
    throw createError('Not authorized to update this court', 403);
  }
  
  const validatedData = courtSchema.partial().parse(req.body);
  
  Object.assign(court, validatedData);
  await court.save();
  
  res.status(200).json({
    success: true,
    message: 'Court updated successfully',
    data: { court },
  });
});

export const deleteCourt = asyncHandler(async (req: AuthRequest, res: Response) => {
  const court = await Court.findById(req.params.id).populate('venue');
  
  if (!court) {
    throw createError('Court not found', 404);
  }
  
  // Check ownership
  if (req.user?.role !== 2 && (court.venue as any).owner.toString() !== req.user?.userId) {
    throw createError('Not authorized to delete this court', 403);
  }
  
  // Remove court from venue
  await Venue.findByIdAndUpdate(court.venue, {
    $pull: { courts: court._id },
  });
  
  await court.deleteOne();
  
  res.status(200).json({
    success: true,
    message: 'Court deleted successfully',
  });
});

export const getAvailableSlots = asyncHandler(async (req: Request, res: Response) => {
  const { courtId } = req.params;
  const { date } = req.query;
  
  if (!date) {
    throw createError('Date is required', 400);
  }
  
  const court = await Court.findById(courtId);
  if (!court) {
    throw createError('Court not found', 404);
  }
  
  // Get existing bookings for the date
  const Booking = require('../models/Booking').default;
  const bookings = await Booking.find({
    court: courtId,
    date: new Date(date as string),
    status: 'confirmed',
  });
  
  // Generate available slots (this is a simplified version)
  const availableSlots = [];
  const startHour = 6; // 6 AM
  const endHour = 22; // 10 PM
  const slotDuration = court.slotDuration;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endMinute = minute + slotDuration;
      const endTimeHour = endMinute >= 60 ? hour + 1 : hour;
      const endTimeMinute = endMinute >= 60 ? endMinute - 60 : endMinute;
      const endTime = `${endTimeHour.toString().padStart(2, '0')}:${endTimeMinute.toString().padStart(2, '0')}`;
      
      if (endTimeHour < endHour) {
        // Check if slot is booked
        const isBooked = bookings.some(booking => {
          return (startTime >= booking.startTime && startTime < booking.endTime) ||
                 (endTime > booking.startTime && endTime <= booking.endTime) ||
                 (startTime <= booking.startTime && endTime >= booking.endTime);
        });
        
        if (!isBooked) {
          // Calculate price (including peak hours)
          let price = court.pricePerSlot;
          
          if (court.peakHours?.enabled) {
            const dayOfWeek = new Date(date as string).getDay();
            const isPeakDay = court.peakHours.days?.includes(dayOfWeek);
            const isPeakTime = startTime >= court.peakHours.startTime! && endTime <= court.peakHours.endTime!;
            
            if (isPeakDay && isPeakTime) {
              price = court.peakHours.peakPricePerSlot || court.pricePerSlot;
            }
          }
          
          availableSlots.push({
            startTime,
            endTime,
            price,
          });
        }
      }
    }
  }
  
  res.status(200).json({
    success: true,
    data: { availableSlots },
  });
});