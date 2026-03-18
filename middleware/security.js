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
        "https://red3.paysky.io:3011",
        "https://cdnjs.cloudflare.com",
        "'unsafe-inline'"
      ],
      "style-src": [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://red3.paysky.io:3011",
        "'unsafe-inline'"
      ],
      "img-src": [
        "'self'",
        "data:",
        "https://cdn.jsdelivr.net",
        "https://red3.paysky.io:3011",
        "https://images.unsplash.com",
        "https://*.unsplash.com",
        "https://*.cloudinary.com",
        "https://*.amazonaws.com"
      ],
      "connect-src": ["'self'", "https://accept.paymob.com", "https://red3.paysky.io:3011"],
      "frame-src": ["'self'", "https://red3.paysky.io:3011"]
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