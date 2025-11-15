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

// ======================
// Hidden Admin Route (Not indexed by search engines)
// ======================
app.get("/admin", (req, res) => {
  const adminHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Access</title>
    <meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
        }
        .container { 
            background: white; padding: 2rem; border-radius: 12px; 
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); max-width: 400px; width: 90%;
        }
        .logo { text-align: center; margin-bottom: 2rem; }
        .logo h1 { color: #667eea; font-size: 1.5rem; }
        .logo p { color: #6b7280; font-size: 0.875rem; margin-top: 0.5rem; }
        .form-group { margin-bottom: 1.5rem; }
        label { display: block; font-weight: 500; color: #374151; margin-bottom: 0.5rem; }
        input { 
            width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; 
            border-radius: 6px; font-size: 1rem;
        }
        input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }
        .btn { 
            width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; border: none; padding: 0.75rem; border-radius: 6px;
            font-size: 1rem; cursor: pointer;
        }
        .btn:hover { transform: translateY(-1px); }
        .error { 
            background: #fee2e2; color: #dc2626; padding: 0.75rem; 
            border-radius: 6px; margin-bottom: 1rem; display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>🔒 Admin Access</h1>
            <p>Authorized Personnel Only</p>
        </div>
        
        <div id="error" class="error"></div>
        
        <form id="authForm">
            <div class="form-group">
                <label>Access Token</label>
                <input type="password" id="token" placeholder="Enter admin token" required>
            </div>
            <button type="submit" class="btn">Authenticate</button>
        </form>
    </div>

    <script>
        document.getElementById('authForm').onsubmit = async (e) => {
            e.preventDefault();
            const token = document.getElementById('token').value;
            
            try {
                const response = await fetch('/api/tour-guide-applications', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                
                if (response.ok) {
                    localStorage.setItem('adminToken', token);
                    // Redirect to admin dashboard in main app
                    window.location.href = '/#admin-dashboard';
                } else {
                    const error = document.getElementById('error');
                    error.textContent = 'Invalid access token';
                    error.style.display = 'block';
                }
            } catch (err) {
                const error = document.getElementById('error');
                error.textContent = 'Connection error';
                error.style.display = 'block';
            }
        };
    </script>
</body>
</html>`;
  
  res.send(adminHtml);
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
