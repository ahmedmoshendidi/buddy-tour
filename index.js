// ======================
// Required Dependencies
// ======================
const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const fs = require("fs");
require("dotenv").config();

// Import routes
const paymentRoutes = require("./routes/paymentRoutes");
const xpayRoutes = require("./routes/xpayRoutes");
const bookingRoutes = require('./routes/bookingRoutes');
const sitemapRoute = require('./routes/sitemapRoute');
const exchangeRatesRoute = require('./routes/exchangeRatesRoute');
const guideApplicationRoutes = require('./routes/guideApplicationRoutes');
const { cleanupExpiredHolds } = require('./controllers/bookingController');

// Import middleware
const redirectMiddleware = require('./middleware/redirects');
const { corsOptions, helmetOptions, rateLimiter } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 5000;

// ======================
// Critical Security Setup
// ======================
app.set("trust proxy", 1); // Essential for Railway/Heroku deployment

// ======================
// Middleware Stack
// ======================
app.use(redirectMiddleware);
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api", rateLimiter);

// ======================
// API Routes
// ======================
app.use("/api", paymentRoutes);
app.use("/api/xpay", xpayRoutes);
app.use('/api', bookingRoutes);
app.use('/api', exchangeRatesRoute);
app.use('/api/tour-guide-applications', guideApplicationRoutes);

// ======================
// Dynamic Sitemap Route
// ======================
app.use(sitemapRoute);



// ======================
// Static Files & Frontend Routes
// ======================

// ملفات public (لو محتاج صور/robots/sitemap قديمة)
app.use(express.static(path.join(__dirname, "public")));

app.get("/payment/success", (req, res) => {
  res.sendFile(path.join(__dirname, "public/success.html"));
});

app.get("/payment/failure", (req, res) => {
  res.sendFile(path.join(__dirname, "public/fail.html"));
});

// ===== NEW DEFAULT FRONTEND (Vite build in frontend/dist) =====
const FRONTEND_DIST = path.join(__dirname, "frontend", "dist");

if (fs.existsSync(FRONTEND_DIST)) {
  // قدّم ملفات الواجهة على الجذر /
  app.use(express.static(FRONTEND_DIST));

  // Path-to-RegExp v8: catch-all باسم
  app.get("/*rest", (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
} else {
  console.warn("⚠️ frontend/dist not found. Run: npm --prefix frontend run build");
}


// ======================
// Error Handling
// ======================
const notFound = path.join(__dirname, "public", "404.html");

app.use((req, res) => {
  if (fs.existsSync(notFound)) {
    return res.status(404).sendFile(notFound);
  }
  // fallback لو مفيش 404.html
  if (req.accepts('html')) {
    return res.status(404).type('html').send('<h1>404 – Not Found</h1>');
  }
  res.status(404).json({ error: 'Not Found' });
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

  // ======================
  // Background Cleanup Job
  // ======================
  // Clean up expired seat holds every 5 minutes
  const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  setInterval(async () => {
    try {
      const cleanedCount = await cleanupExpiredHolds();
      if (cleanedCount > 0) {
        console.log(`🧹 Background cleanup: Released ${cleanedCount} expired holds`);
      }
    } catch (error) {
      console.error('❌ Background cleanup error:', error);
    }
  }, CLEANUP_INTERVAL);

  console.log('🕐 Background hold cleanup job started (every 5 minutes)');
});
