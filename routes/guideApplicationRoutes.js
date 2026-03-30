const express = require('express');
const router = express.Router();
const { 
  submitGuideApplication
} = require('../controllers/guideApplicationController');

// Public Routes

// @route   POST /api/tour-guide-applications
// @desc    Submit a new tour guide application
// @access  Public
router.post('/', submitGuideApplication);

module.exports = router;