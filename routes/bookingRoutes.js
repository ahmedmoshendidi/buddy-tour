const express = require('express');
const router = express.Router();
const { bookTour } = require('../controllers/bookingController');
const { getTourById, getTourBySlug, getAllTours } = require('../controllers/tourController');

// POST /api/book-tour
router.post('/book-tour', bookTour);

// GET /api/tours/:id
router.get("/tours/:id", getTourById);

// GET /api/tours/by-slug/:slug
router.get('/tours/by-slug/:slug', getTourBySlug);

// GET /api/tours
router.get("/tours", getAllTours);


module.exports = router;
