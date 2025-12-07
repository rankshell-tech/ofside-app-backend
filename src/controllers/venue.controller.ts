import { Request, Response } from 'express';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import Venue from '../models/Venue';
import Court from '../models/Court';
import User from '../models/User';
import Payment from '../models/Payment';

interface CourtInput {
  courtName: string;
  courtSportType: string;
  surfaceType?: string;
  courtSize?: string;
  isIndoor?: boolean;
  hasLighting?: boolean;
  courtImages?: {
    cover?: string;
    logo?: string;
    others?: string[];
  };
  courtSlotDuration?: number;
  courtMaxPeople: number;
  courtPricePerSlot: number;
  courtPeakEnabled?: boolean;
  courtPeakDays?: string[];
  courtPeakStart?: string;
  courtPeakEnd?: string;
  courtPeakPricePerSlot?: number;
}

export const createVenue = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    venueName,
    venueType,
    sportsOffered,
    description,
    is24HoursOpen,
    shopNo,
    floorTower,
    areaSectorLocality,
    city,
    pincode,
    latitude,
    longitude,
    contactPersonName,
    contactPhone,
    contactEmail,
    ownerName,
    ownerPhone,
    ownerEmail,
    amenities,
    courts,
    declarationAgreed,
    paymentId,
  } = req.body;

  // Required fields check
  if (!venueName || !description || !contactPersonName || !contactPhone || !contactEmail || !city || !pincode || !Array.isArray(courts) || courts.length === 0) {
    throw createError('Missing required fields.', 400);
  }

  // Build full address
  const fullAddress = `${shopNo || ''}, ${floorTower || ''}, ${areaSectorLocality || ''}`.replace(/^,\s*|,\s*$/g, '');

  // Check for duplicate venue
  const existingVenue = await Venue.findOne({
    venueName,
    'location.address': fullAddress
  });

  if (existingVenue) {
    throw createError('Venue already exists at this location!', 409);
  }

  // Find or create user
  let userWhoCreated = await User.findOne({ email: contactEmail });
  if (!userWhoCreated) {
    userWhoCreated = await User.create({
      name: contactPersonName,
      mobile: contactPhone,
      email: contactEmail,
      role: 1,
      isActive: true,
    });
  }
  
  // Promote user to venue owner if needed
  if (userWhoCreated.role === 0) {
    userWhoCreated.role = 1;
    await userWhoCreated.save();
  }

  // Create venue first
  const venueData = {
    venueName,
    venueType,
    sportsOffered,
    description,
    amenities,
    is24HoursOpen,
    location: {
      address: fullAddress,
      city,
      country: 'India',
      pincode,
      coordinates: {
        type: 'Point',
        coordinates: [
          longitude ? parseFloat(longitude) : 0,
          latitude ? parseFloat(latitude) : 0
        ]
      }
    },
    contact: {
      name: contactPersonName,
      phone: contactPhone,
      email: contactEmail
    },
    owner: {
      name: ownerName,
      phone: ownerPhone,
      email: ownerEmail
    },
    courts: [], // Will be populated after creating courts
    declarationAgreed,
    rawVenueData: req.body,
    createdBy: userWhoCreated._id
  };

  const newVenue = await Venue.create(venueData);

  // Create courts and link them to the venue

  const createdCourts: any[] = [];

  for (const court of courts as CourtInput[]) {
    const courtData = {
      venue: newVenue._id,
      name: court.courtName,
      sportType: court.courtSportType,
      surfaceType: court.surfaceType,
      size: court.courtSize || '',
      isIndoor: court.isIndoor ?? false,
      hasLighting: court.hasLighting ?? false,
      images: {
        cover: court.courtImages?.cover ?? '',
        logo: court.courtImages?.logo ?? '',
        others: Array.isArray(court.courtImages?.others) ? court.courtImages.others : [],
      },
      slotDuration: court.courtSlotDuration ?? 0,
      maxPeople: court.courtMaxPeople ?? 0,
      pricePerSlot: court.courtPricePerSlot ?? 0,
      peakEnabled: court.courtPeakEnabled ?? false,
      peakDays: Array.isArray(court.courtPeakDays)
        ? court.courtPeakDays.map(day => {
            const dayMap: { [key: string]: number } = {
              'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
              'thursday': 4, 'friday': 5, 'saturday': 6
            };
            return typeof day === 'string' ? dayMap[day.toLowerCase()] ?? parseInt(day) : day;
          })
        : [],
      peakStart: court.courtPeakStart ?? '',
      peakEnd: court.courtPeakEnd ?? '',
      peakPricePerSlot: court.courtPeakPricePerSlot ?? 0
    };

    const newCourt = await Court.create(courtData);
    createdCourts.push(newCourt._id);
  }

  // Update venue with court IDs
  newVenue.courts = createdCourts;
  await newVenue.save();

  // Link payment to venue if paymentId is provided
  if (paymentId) {
    try {
      await Payment.findOneAndUpdate(
        { paymentId },
        {
          venueId: newVenue._id,
          status: 'completed',
        },
        { new: true }
      );
    } catch (paymentError) {
      // Log but don't fail venue creation if payment update fails
      console.error('Failed to link payment to venue:', paymentError);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Venue created successfully',
    data: newVenue
  });
});

export const getVenues = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  
  const filters: any = {};
  
  // Filter by verification status
  if (req.query.isVerified !== undefined) {
    filters.isVerified = req.query.isVerified === 'true';
  }
  
  // Filter by active status
  if (req.query.isActive !== undefined) {
    filters.isActive = req.query.isActive === 'true';
  }
  
  // Filter by sports
  if (req.query.sport) {
    filters.sportsOffered = { $in: [req.query.sport] };
  }
  
  // Filter by city
  if (req.query.city) {
    filters['location.city'] = new RegExp(req.query.city as string, 'i');
  }
  
  // Location-based search
  if (req.query.lat && req.query.lng && req.query.radius) {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string); // in km
    
    filters['location.coordinates'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: radius * 1000 // Convert km to meters
      }
    };
  }
  
  const venues = await Venue.find(filters)
    .populate('createdBy', 'name mobile email')
    .populate('courts')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Venue.countDocuments(filters);
  
  res.status(200).json({
    success: true,
    data: {
      venues,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const getVenueById = asyncHandler(async (req: Request, res: Response) => {
  const venue = await Venue.findById(req.params.id)
    .populate('createdBy', 'name mobile email')
    .populate('courts');
  
  if (!venue) {
    throw createError('Venue not found', 404);
  }
  
  res.status(200).json({
    success: true,
    data: { venue },
  });
});

export const updateVenue = asyncHandler(async (req: AuthRequest, res: Response) => {
  const venue = await Venue.findById(req.params.id);
  
  if (!venue) {
    throw createError('Venue not found', 404);
  }
  
  // Check ownership (owners can update their venues, admins can update any)
  if (req.user?.role !== 2 && venue.createdBy.toString() !== req.user?.userId) {
    throw createError('Not authorized to update this venue', 403);
  }
  
  Object.assign(venue, req.body);
  await venue.save();
  
  res.status(200).json({
    success: true,
    message: 'Venue updated successfully',
    data: { venue },
  });
});

export const deleteVenue = asyncHandler(async (req: AuthRequest, res: Response) => {
  const venue = await Venue.findById(req.params.id);
  
  if (!venue) {
    throw createError('Venue not found', 404);
  }
  
  // Check ownership (owners can delete their venues, admins can delete any)
  if (req.user?.role !== 2 && venue.createdBy.toString() !== req.user?.userId) {
    throw createError('Not authorized to delete this venue', 403);
  }
  
  await venue.deleteOne();
  
  res.status(200).json({
    success: true,
    message: 'Venue deleted successfully',
  });
});

export const approveVenue = asyncHandler(async (req: AuthRequest, res: Response) => {
  const venue = await Venue.findById(req.params.id);
  
  if (!venue) {
    throw createError('Venue not found', 404);
  }
  
  venue.isVerified = true;
  await venue.save();
  
  res.status(200).json({
    success: true,
    message: 'Venue approved successfully',
    data: { venue },
  });
});

export const getOwnerVenues = asyncHandler(async (req: AuthRequest, res: Response) => {
  const venues = await Venue.find({ createdBy: req.user?.userId })
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    data: { venues },
  });
});