const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

// CORS configuration
const corsOptions = {
  origin: (origin, cb) => {
    const allowed = [
      "https://buddytourguide.com",
      "http://localhost:3000", 
      "http://127.0.0.1:3000",
      "http://localhost:5000",
      "http://127.0.0.1:5000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://buddy-tour-staging.up.railway.app",
    ];
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true
};

// Helmet security configuration
const helmetOptions = {
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cube.paysky.io:6006",
        "https://cdnjs.cloudflare.com",
        "https://connect.facebook.net",
        "https://www.clarity.ms",
        "https://scripts.clarity.ms",
        "https://*.clarity.ms",
        "https://*.noonpayments.com",
        "'unsafe-inline'"
      ],
      "style-src": [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cube.paysky.io:6006",
        "https://*.noonpayments.com",
        "'unsafe-inline'"
      ],
      "img-src": [
        "'self'",
        "data:",
        "https://cdn.jsdelivr.net",
        "https://cube.paysky.io:6006",
        "https://images.unsplash.com",
        "https://*.unsplash.com",
        "https://*.cloudinary.com",
        "https://*.amazonaws.com",
        "https://www.facebook.com",
        "https://*.clarity.ms",
        "https://buddytourguide.com",
        "https://*.noonpayments.com"
      ],
      "connect-src": [
        "'self'", 
        "https://accept.paymob.com", 
        "https://cube.paysky.io:6006",
        "https://www.facebook.com",
        "https://*.clarity.ms",
        "https://*.xpay.app",
        "https://*.noonpayments.com"
      ],
      "frame-src": [
        "'self'", 
        "https://cube.paysky.io:6006",
        "https://*.xpay.app",
        "https://www.facebook.com",
        "https://*.noonpayments.com"
      ],
      "form-action": [
        "'self'",
        "https://www.facebook.com",
        "https://*.noonpayments.com"
      ]
    }
  }
};

// Rate limiter configuration (100 requests/15min)
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later",
});

module.exports = {
  corsOptions,
  helmetOptions,
  rateLimiter
};