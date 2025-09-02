const express = require('express');
const router = express.Router();
const { bookTour, checkAvailability, createSeatHold, confirmSeatHold, releaseSeatHold, cleanupExpiredHolds } = require('../controllers/bookingController');
const { getTourById, getTourBySlug, getAllTours } = require('../controllers/tourController');

// POST /api/book-tour
router.post('/book-tour', bookTour);

// GET /api/tours/:id
router.get("/tours/:id", getTourById);

// GET /api/tours/by-slug/:slug
router.get('/tours/by-slug/:slug', getTourBySlug);

// GET /api/tours
router.get("/tours", getAllTours);

// GET /api/check-availability
router.get('/check-availability', checkAvailability);

// === Soft Hold System Routes ===
// POST /api/create-hold
router.post('/create-hold', createSeatHold);

// POST /api/confirm-hold  
router.post('/confirm-hold', confirmSeatHold);

// POST /api/release-hold
router.post('/release-hold', releaseSeatHold);

// GET /api/cleanup-expired-holds (manual cleanup for testing)
router.get('/cleanup-expired-holds', cleanupExpiredHolds);

module.exports = router;
