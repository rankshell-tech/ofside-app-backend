import { Types } from "mongoose";

export interface IUser {
  _id?: string;
  name: string;
  username?: string;
  mobile: string;
  email?: string;
  referralCode?: string;
  role: 0 | 1 | 2; // 0: user, 1: venue owner, 2: admin
  isActive: boolean;
  profilePicture?: string;
  gender?: 'male' | 'female' | 'other';
  favSports?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  dateOfBirth?: Date;
}

export interface IVenue {
  _id?: string;
  venueName: string;
  venueType?: string;
  sportsOffered?: string[];
  description: string;
  amenities?: string[];
  is24HoursOpen: boolean;
  location: {
    address: string;
    city: string;
    country?: string;
    pincode: string;
    coordinates: {
      type: string;
      coordinates: number[]; // [lng, lat]
    };
  };
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  owner?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  courts: string[]; // Array of Court IDs
  declarationAgreed?: boolean;
  rating?: number;
  reviewsCount?: number;
  isActive?: boolean;
  isTrending?: boolean;
  isVerified?: boolean;
  pendingChanges?: any;
  rawVenueData?: any;
  createdBy: string | Types.ObjectId; // User ID or Mongoose ObjectId
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICourt {
  _id?: string;
  name: string;
  venue: string | Types.ObjectId; // Venue ID or Mongoose ObjectId
  sportType: string;
  surfaceType?: string;
  size?: string;
  isIndoor?: boolean;
  hasLighting?: boolean;
  images?: {
    cover?: string;
    logo?: string;
    others?: string[];
  };
  slotDuration?: number; // in minutes
  maxPeople: number;
  pricePerSlot: number;
  peakEnabled?: boolean;
  peakDays?: number[];
  peakStart?: string;
  peakEnd?: string;
  peakPricePerSlot?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  days?: number[];
}

export interface IBooking {
  _id?: string;
  user: string | Types.ObjectId; // User ID or Mongoose ObjectId
  court: string | Types.ObjectId; // Court ID or Mongoose ObjectId
  venue: string | Types.ObjectId; // Venue ID or Mongoose ObjectId
  date: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  totalPrice: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRulebook {
  _id?: string;
  sportType: string;
  rules: string; // All rules in a single field
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMatch {
  _id?: string;
  court: string | Types.ObjectId; // Court ID or Mongoose ObjectId
  venue: string | Types.ObjectId; // Venue ID or Mongoose ObjectId
  sportType: string;
  date: Date;
  startTime: string;
  endTime: string;
  players: string[]; // User IDs
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  score?: any; // Sport-specific score format
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPlayerStats {
  _id?: string;
  player: string | Types.ObjectId; // User ID or Mongoose ObjectId
  match: string | Types.ObjectId; // Match ID or Mongoose ObjectId
  sportType: string;
  stats: {
    wins?: number;
    losses?: number;
    scores?: number;
    assists?: number;
    goals?: number;
    [key: string]: any;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOTP {
  _id?: string;
  identifier: string; // mobile or email
  otp: string;
  type: 'signup' | 'login' | 'resend';
  expiresAt: Date;
  verified: boolean;
  signupData?: any;
  createdAt?: Date;
}

export interface JWTPayload {
  userId: string;
  mobile: string;
  role: number;
}