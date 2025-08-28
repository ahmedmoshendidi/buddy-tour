// ======================
// Required Dependencies
// ======================
const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const sitemapRoute = require('./routes/sitemapRoute');
const fs = require("fs");
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
// Redirect Middleware 301
// ======================


app.use((req, res, next) => {
  const host = req.hostname;

  // Railway → الدومين الرسمي
  if (host === "buddy-tour-production.up.railway.app") {
    return res.redirect(301, "https://buddytourguide.com" + req.originalUrl);
  }

  // اختياري: www → apex
  if (host === "www.buddytourguide.com") {
    return res.redirect(301, "https://buddytourguide.com" + req.originalUrl);
  }

  // إجبار HTTPS
  if (req.protocol === "http") {
    return res.redirect(301, "https://" + host + req.originalUrl);
  }

  next();
});


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

const allowed = [
  "https://buddytourguide.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true
}));


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



// ==== Exchange rates proxy (/api/rates) ====
// Node 18+ عنده fetch جاهز. تحت ذلك هنجيب node-fetch ديناميكياً.
const fetchAny = global.fetch
  ? (...args) => global.fetch(...args)
  : (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const RATES_URL =
  "https://api.exchangerate.host/latest?base=USD&symbols=USD,EUR,GBP,CAD,EGP";

// كاش بسيط في الذاكرة لمدة ساعة
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h
let ratesCache = { ts: 0, data: null };

app.get(['/api/rates', '/api/rates/'], async (req, res) => {
  try {
    // رجّع من الكاش لو لسه صالح
    if (ratesCache.data && Date.now() - ratesCache.ts < CACHE_TTL_MS) {
      res.set('Cache-Control', 'public, max-age=3600');
      return res.json(ratesCache.data);
    }

    const r = await fetchAny(RATES_URL, {
      headers: { 'user-agent': 'BuddyTour/1.0' },
    });
    if (!r.ok) throw new Error(`Rates HTTP ${r.status}`);
    const data = await r.json();

    const rates = {
      USD: 1,
      EUR: data?.rates?.EUR ?? 0.92,
      GBP: data?.rates?.GBP ?? 0.78,
      CAD: data?.rates?.CAD ?? 1.37,
      EGP: data?.rates?.EGP ?? 48.5,
    };

    const payload = {
      base: 'USD',
      provider: 'exchangerate.host',
      updated_at: new Date().toISOString(),
      rates,
    };

    ratesCache = { ts: Date.now(), data: payload };
    res.set('Cache-Control', 'public, max-age=3600');
    return res.json(payload);
  } catch (err) {
    // Fallback محترم لو الـ API وقع
    const payload = {
      base: 'USD',
      provider: 'fallback',
      updated_at: new Date().toISOString(),
      rates: { USD: 1, EUR: 0.92, GBP: 0.78, CAD: 1.37, EGP: 48.5 },
    };
    res.set('Cache-Control', 'no-store');
    return res.json(payload);
  }
});

// ======================
// dynamic Sitemap Route
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
});
