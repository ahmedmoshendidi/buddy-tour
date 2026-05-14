const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/payoutController');
const { adminAuth } = require('../middleware/adminAuth');

// Apply admin authentication to all payout management routes
router.use(adminAuth);

// Trigger a payout (Admin only)
router.post('/trigger/:bookingId', payoutController.triggerAutomatedPayout);

// Get due payouts
router.get('/due', payoutController.getDuePayouts);

// Get all payouts
router.get('/', payoutController.getPayouts);

// Webhook for Kashier status updates
router.post('/webhook', payoutController.handlePayoutWebhook);

module.exports = router;
