const express = require('express');
const router = express.Router();
const { 
  submitGuideApplication, 
  getAllApplications, 
  getApplicationById, 
  updateApplicationStatus 
} = require('../controllers/guideApplicationController');

// Public Routes

// @route   POST /api/tour-guide-applications
// @desc    Submit a new tour guide application
// @access  Public
router.post('/', submitGuideApplication);

// Admin Routes (TODO: Add authentication middleware)

// @route   GET /api/tour-guide-applications
// @desc    Get all guide applications (admin only)
// @access  Private/Admin
router.get('/', getAllApplications);

// @route   GET /api/tour-guide-applications/:id
// @desc    Get single guide application by ID (admin only)  
// @access  Private/Admin
router.get('/:id', getApplicationById);

// @route   PUT /api/tour-guide-applications/:id/status
// @desc    Update application status (admin only)
// @access  Private/Admin
router.put('/:id/status', updateApplicationStatus);

module.exports = router;