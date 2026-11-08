const express = require('express');
const router = express.Router();
const bookingsController = require('./bookings.controller');
const { requireAuth } = require('../../middleware/auth');

// Public PNR lookup
router.get('/pnr/:pnr', bookingsController.getBookingByPNR);

// Authenticated booking endpoints
router.post('/', requireAuth, bookingsController.createBooking);
router.get('/my-bookings', requireAuth, bookingsController.getUserBookings);
router.get('/:id/cancellation-quote', requireAuth, bookingsController.previewCancellationQuote);
router.post('/:id/cancel', requireAuth, bookingsController.cancelBooking);

module.exports = router;

