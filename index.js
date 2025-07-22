// index.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const paymentRoutes = require("./routes/paymentRoutes");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// ======================
// Middleware Configurations
// ======================

// 1. الأمان الأساسي
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST"]
}));

// 2. Rate Limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 3. Body Parsing with JSON verification
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
      req.rawBody = buf.toString();
    } catch (e) {
      console.error('❌ Invalid JSON:', buf.toString());
      throw new Error('Invalid JSON payload');
    }
  }
}));

// ======================
// Static Files Serving
// ======================
app.use(express.static(path.join(__dirname), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'public, max-age=3600');
  }
}));

// ======================
// API Routes
// ======================
app.use("/api", paymentRoutes);

// ======================
// Explicit Page Routes
// ======================
const servePage = (pageName) => (req, res) => {
  res.sendFile(path.join(__dirname, `${pageName}.html`), {
    headers: {
      'Content-Security-Policy': "default-src 'self'"
    }
  });
};

app.get("/success", servePage("success"));
app.get("/fail", servePage("fail"));
app.get("/payment", servePage("index"));

// ======================
// Error Handling
// ======================
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "404.html"));
});

// ======================
// Server Startup
// ======================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});