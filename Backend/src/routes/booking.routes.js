import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import {
  createBooking,
  listBookings,
  getMyBookings,
  getBookingById,
  rescheduleBooking,
  cancelBooking,
  confirmBooking,
} from '../controllers/booking.controller.js';

const router = Router();

/**
 * API 37: POST /api/bookings
 * Create a new booking
 */
router.post('/', authenticate, authorize('customer'), createBooking);

/**
 * API 38: GET /api/bookings
 * List bookings (organiser: own types, admin: all)
 */
router.get('/', authenticate, authorize('organiser', 'admin'), listBookings);

/**
 * API 39: GET /api/bookings/my
 * Get customer's bookings
 */
router.get('/my', authenticate, authorize('customer'), getMyBookings);

/**
 * API 40: GET /api/bookings/:id
 * Get booking detail (role-based access in handler)
 */
router.get('/:id', authenticate, getBookingById);

/**
 * API 41: PUT /api/bookings/:id/reschedule
 * Reschedule booking
 */
router.put('/:id/reschedule', authenticate, authorize('customer'), rescheduleBooking);

/**
 * API 42: PUT /api/bookings/:id/cancel
 * Cancel booking (role-based access in handler)
 */
router.put('/:id/cancel', authenticate, cancelBooking);

/**
 * API 43: PUT /api/bookings/:id/confirm
 * Confirm pending booking
 */
router.put('/:id/confirm', authenticate, authorize('organiser', 'admin'), confirmBooking);

export default router;
