const express = require('express');
const router = express.Router();
const bookingsController = require('./bookings.controller');
const { requireAuth, optionalAuth } = require('../../middleware/auth');

// Public PNR lookup
router.get('/pnr/:pnr', bookingsController.getBookingByPNR);

// Booking endpoints (supports authenticated customer bookings as well as guest bookings)
router.post('/', optionalAuth, bookingsController.createBooking);
router.get('/my-bookings', requireAuth, bookingsController.getUserBookings);
router.get('/:id/cancellation-quote', requireAuth, bookingsController.previewCancellationQuote);
router.post('/:id/cancel', requireAuth, bookingsController.cancelBooking);

module.exports = router;

