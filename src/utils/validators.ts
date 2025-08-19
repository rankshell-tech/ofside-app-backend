import { z } from 'zod';

// Auth validators
export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  mobile: z.string().regex(/^[0-9]{10}$/, 'Invalid mobile number'),
  email: z.string().email('Invalid email').optional(),
  referralCode: z.string().optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Mobile or email is required'),
});

export const verifyOTPSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  otp: z.string().regex(/^\d{6}$/, 'Invalid OTP format'),
  type: z.enum(['signup', 'login']),
});

// Venue validators
export const venueSchema = z.object({
  venueName: z.string().min(1, 'Venue name is required').max(200, 'Venue name too long'),
  venueType: z.enum(['indoor', 'outdoor', 'hybrid']),
  sportsOffered: z.array(z.enum(['badminton', 'tennis', 'cricket', 'football', 'basketball', 'volleyball', 'table-tennis', 'squash'])),
  description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
  is24HoursOpen: z.boolean().default(false),
  shopNo: z.string().optional(),
  floorTower: z.string().optional(),
  areaSectorLocality: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Invalid pincode'),
  latitude: z.union([z.string(), z.number()]).refine(val => !isNaN(Number(val)) && Number(val) >= -90 && Number(val) <= 90, 'Invalid latitude'),
  longitude: z.union([z.string(), z.number()]).refine(val => !isNaN(Number(val)) && Number(val) >= -180 && Number(val) <= 180, 'Invalid longitude'),
  contactPersonName: z.string().min(1, 'Contact person name is required'),
  contactPhone: z.string().regex(/^[0-9]{10}$/, 'Invalid phone number'),
  contactEmail: z.string().email('Invalid email'),
  ownerName: z.string().optional(),
  ownerPhone: z.string().regex(/^[0-9]{10}$/, 'Invalid owner phone number').optional(),
  ownerEmail: z.string().email('Invalid owner email').optional(),
  amenities: z.array(z.enum(['parking', 'wifi', 'cafe', 'locker', 'shower', 'ac', 'changing-room', 'first-aid'])).optional(),
  courts: z.array(z.object({
    courtName: z.string().min(1, 'Court name is required'),
    courtSportType: z.enum(['badminton', 'tennis', 'cricket', 'football', 'basketball', 'volleyball', 'table-tennis', 'squash']),
    surfaceType: z.enum(['synthetic', 'grass', 'wooden', 'concrete', 'clay', 'rubber']),
    courtSize: z.string().optional(),
    isIndoor: z.boolean().optional(),
    hasLighting: z.boolean().optional(),
    courtImages: z.object({
      cover: z.string().optional(),
      logo: z.string().optional(),
      others: z.array(z.string()).optional(),
    }).optional(),
    courtSlotDuration: z.number().min(15, 'Minimum slot duration is 15 minutes').max(240, 'Maximum slot duration is 240 minutes').optional(),
    courtMaxPeople: z.number().min(1, 'Minimum 1 person required').max(50, 'Maximum 50 people allowed').optional(),
    courtPricePerSlot: z.number().min(0, 'Price cannot be negative').optional(),
    courtPeakEnabled: z.boolean().optional(),
    courtPeakDays: z.array(z.union([
      z.enum(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']),
      z.number().min(0).max(6)
    ])).optional(),
    courtPeakStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid start time format').optional(),
    courtPeakEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid end time format').optional(),
    courtPeakPricePerSlot: z.number().min(0, 'Peak price cannot be negative').optional(),
  })).min(1, 'At least one court is required'),
  declarationAgreed: z.boolean().refine(val => val === true, { message: 'Declaration must be agreed' }),
});

// Court validators
export const courtSchema = z.object({
  courtName: z.string().min(1, 'Court name is required').max(100, 'Court name too long'),
  venue: z.string().min(1, 'Venue ID is required'),
  sportType: z.string().min(1, 'Sport type is required'),
  surfaceType: z.string().min(1, 'Surface type is required'),
  slotDuration: z.number().min(15, 'Minimum slot duration is 15 minutes').max(240, 'Maximum slot duration is 240 minutes'),
  maxPeople: z.number().min(1, 'Minimum 1 person required').max(50, 'Maximum 50 people allowed'),
  pricePerSlot: z.number().min(0, 'Price cannot be negative'),
  peakHours: z.object({
    enabled: z.boolean().default(false),
    days: z.array(z.number().min(0).max(6)).optional(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid start time format').optional(),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid end time format').optional(),
    peakPricePerSlot: z.number().min(0, 'Peak price cannot be negative').optional(),
  }).optional(),
});

// Booking validators
export const bookingSchema = z.object({
  courtId: z.string().min(1, 'Court ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid start time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid end time format'),
});
// Rulebook validators
export const rulebookSchema = z.object({
  sportType: z.string().min(1, 'Sport type is required'),
  rules: z.string().min(1, 'Rules are required'),
});

// Match validators
export const matchSchema = z.object({
  courtId: z.string().min(1, 'Court ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid start time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid end time format'),
  players: z.array(z.string()).min(2, 'At least 2 players required'),
});

// Player stats validators
export const playerStatsSchema = z.object({
  matchId: z.string().min(1, 'Match ID is required'),
  stats: z.object({
    wins: z.number().min(0).optional(),
    losses: z.number().min(0).optional(),
    scores: z.number().min(0).optional(),
    assists: z.number().min(0).optional(),
    goals: z.number().min(0).optional(),
  }),
});