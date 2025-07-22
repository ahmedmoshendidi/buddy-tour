// ======================
// Required Dependencies
// ======================
const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// ======================
// Critical Security Setup
// ======================
app.set('trust proxy', true); // Essential for Railway/Heroku deployment

// ======================
// Middleware Stack
// ======================
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiter (100 requests/15min)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later"
});
app.use("/api", limiter);

// ======================
// Paymob Payment Routes
// ======================
app.post("/api/payment/initiate", async (req, res) => {
  try {
    // 1. Authenticate with Paymob
    const { data: auth } = await axios.post(
      "https://accept.paymob.com/api/auth/tokens",
      { api_key: process.env.PAYMOB_API_KEY }
    );

    // 2. Create Payment Request
    const { data: paymentKey } = await axios.post(
      "https://accept.paymob.com/api/acceptance/payment_keys",
      {
        auth_token: auth.token,
        amount_cents: Math.round(req.body.amount * 100),
        integration_id: process.env.PAYMOB_INTEGRATION_ID,
        currency: "EGP",
        billing_data: req.body.billing_data || {
          email: "customer@example.com",
          phone_number: "01012345678"
        }
      }
    );

    // 3. Return Payment URL
    res.json({
      payment_url: `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey.token}`
    });

  } catch (error) {
    console.error("Payment Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Payment processing failed" });
  }
});

// ======================
// Static Files & Frontend Routes
// ======================
app.use(express.static(path.join(__dirname, "public")));

// Payment Status Pages
app.get("/payment/success", (req, res) => {
  res.sendFile(path.join(__dirname, "public/success.html"));
});

app.get("/payment/failure", (req, res) => {
  res.sendFile(path.join(__dirname, "public/fail.html"));
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