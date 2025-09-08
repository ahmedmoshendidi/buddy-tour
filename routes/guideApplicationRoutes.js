const express = require('express');
const router = express.Router();
const { 
  submitGuideApplication, 
  getAllApplications, 
  getApplicationById, 
  updateApplicationStatus 
} = require('../controllers/guideApplicationController');
const { adminAuthDev } = require('../middleware/adminAuth');

// Public Routes

// @route   POST /api/tour-guide-applications
// @desc    Submit a new tour guide application
// @access  Public
router.post('/', submitGuideApplication);

// Admin Routes (Protected with authentication)

// @route   GET /api/tour-guide-applications
// @desc    Get all guide applications (admin only)
// @access  Private/Admin
router.get('/', adminAuthDev, getAllApplications);

// @route   GET /api/tour-guide-applications/:id
// @desc    Get single guide application by ID (admin only)  
// @access  Private/Admin
router.get('/:id', adminAuthDev, getApplicationById);

// @route   PUT /api/tour-guide-applications/:id/status
// @desc    Update application status (admin only)
// @access  Private/Admin
router.put('/:id/status', adminAuthDev, updateApplicationStatus);

module.exports = router;