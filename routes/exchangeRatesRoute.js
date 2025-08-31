const express = require('express');
const router = express.Router();
const { getExchangeRates } = require('../services/exchangeRates');

// GET /api/rates
router.get(['/rates', '/rates/'], async (req, res) => {
  try {
    const result = await getExchangeRates();
    
    if (result.success) {
      res.set('Cache-Control', 'public, max-age=3600');
      return res.json(result.data);
    } else {
      res.set('Cache-Control', 'no-store');
      return res.json(result.data);
    }
  } catch (error) {
    console.error('Exchange rates endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

module.exports = router;