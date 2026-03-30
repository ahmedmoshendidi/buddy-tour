const express = require('express');
const router = express.Router();
const { 
  submitGuideApplication, 
  getAllApplications, 
  getApplicationById, 
  updateApplicationStatus 
} = require('../controllers/guideApplicationController');
const { adminAuth } = require('../middleware/adminAuth');

// Public Routes

// @route   POST /api/tour-guide-applications
// @desc    Submit a new tour guide application
// @access  Public
router.post('/', submitGuideApplication);

// Admin Routes (Protected with authentication)

// @route   GET /api/tour-guide-applications
// @desc    Get all guide applications (admin only)
// @access  Private/Admin
router.get('/', adminAuth, getAllApplications);

// @route   GET /api/tour-guide-applications/:id
// @desc    Get single guide application by ID (admin only)  
// @access  Private/Admin
router.get('/:id', adminAuth, getApplicationById);

// @route   PUT /api/tour-guide-applications/:id/status
// @desc    Update application status (admin only)
// @access  Private/Admin
router.put('/:id/status', adminAuth, updateApplicationStatus);

module.exports = router;