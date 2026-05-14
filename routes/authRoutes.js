const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'your_jwt_secret_key_2024',
    { expiresIn: '30d' }
  );
};

// --- Google Auth ---
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = generateToken(req.user);
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}&role=${req.user.role}`);
  }
);

// --- Facebook Auth ---
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}&role=${req.user.role}`);
  }
);

module.exports = router;
