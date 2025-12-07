import { Router } from 'express';
import {
  getVenuePartnerDashboard,
  getVenueBookingsForPartner,
  getAllVenuePartnerBookings,
  createManualBooking,
} from '../controllers/venuePartner.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Get venue partner dashboard with analytics
// Allow role 0 (regular users) who have created venues, role 1 (venue owners), and role 2 (admins)
router.get('/dashboard', authenticate, getVenuePartnerDashboard);

// Get all bookings for all venues owned by the user
router.get('/bookings', authenticate, getAllVenuePartnerBookings);

// Create manual booking by venue partner
router.post('/bookings/manual', authenticate, createManualBooking);

// Get bookings for a specific venue (for venue partner)
router.get('/bookings/:venueId', authenticate, getVenueBookingsForPartner);

export default router;

