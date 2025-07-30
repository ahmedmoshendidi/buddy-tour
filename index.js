// ======================
// Required Dependencies
// ======================
const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const paymentRoutes = require("./routes/paymentRoutes");
const bookingRoutes = require('./routes/bookingRoutes');



const app = express();
const PORT = process.env.PORT || 5000;

// ======================
// Critical Security Setup
// ======================
app.set("trust proxy", true); // Essential for Railway/Heroku deployment

// ======================
// Middleware Stack
// ======================
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": [
          "'self'",
          "https://cdn.jsdelivr.net",
          "'unsafe-inline'"
        ],
        "style-src": [
          "'self'",
          "https://cdn.jsdelivr.net",
          "'unsafe-inline'"
        ],
        "img-src": [
          "'self'",
          "data:",
          "https://cdn.jsdelivr.net"  // ✅ أضف هذا السطر
        ],
        "connect-src": ["'self'", "https://accept.paymob.com"]
      }
    }
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiter (100 requests/15min)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later",
});
app.use("/api", limiter);

// ======================
// Paymob Payment Routes
// ======================
app.use("/api", paymentRoutes);

// ======================
// Booking Tour Routes
// ======================
app.use('/api', bookingRoutes);

// ======================
// Static Files & Frontend Routes
// ======================
app.use(express.static(path.join(__dirname, "client/dist")));
app.use(express.static(path.join(__dirname, "public")));

app.get("/payment/success", (req, res) => {
  res.sendFile(path.join(__dirname, "public/success.html"));
});

app.get("/payment/failure", (req, res) => {
  res.sendFile(path.join(__dirname, "public/fail.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
});

// ======================
// Error Handling
// ======================
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public/404.html"));
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).send("Internal Server Error");
});

// ======================
// Server Initialization
// ======================
app.listen(PORT, () => {
  console.log(`
  🚀 Server running on port ${PORT}
  🌐 Frontend: ${process.env.FRONTEND_URL}
  🔒 HMAC Enabled: ${!!process.env.PAYMOB_HMAC_SECRET}
  `);
});
