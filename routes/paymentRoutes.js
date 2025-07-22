const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const sendConfirmationEmail = require("../utils/sendConfirmationEmail");
require("dotenv").config();

const router = express.Router();

// إعدادات Paymob من ملف البيئة
const {
  PAYMOB_API_KEY,
  PAYMOB_INTEGRATION_ID,
  PAYMOB_IFRAME_ID,
  PAYMOB_HMAC_SECRET,
  ADMIN_EMAIL = "ahmedmoalshendidi@gmail.com",
  FRONTEND_URL 
} = process.env;

// تخزين مؤقت لحالات الدفع
const paymentStatus = new Map();

// ============== وظائف مساعدة محسنة ==============
async function getAuthToken() {
  try {
    const response = await axios.post("https://accept.paymob.com/api/auth/tokens", {
      api_key: PAYMOB_API_KEY,
    });
    return response.data.token;
  } catch (error) {
    console.error("❌ Failed to get auth token:", error.response?.data || error.message);
    throw new Error("Failed to authenticate with Paymob");
  }
}

async function createOrder(token, amountCents = 500) {
  try {
    const response = await axios.post("https://accept.paymob.com/api/ecommerce/orders", {
      auth_token: token,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: "EGP",
      items: [],
    });
    return response.data.id;
  } catch (error) {
    console.error("❌ Failed to create order:", error.response?.data || error.message);
    throw new Error("Failed to create order");
  }
}

async function generatePaymentKey(token, orderId, billingData) {
  try {
    const response = await axios.post("https://accept.paymob.com/api/acceptance/payment_keys", {
      auth_token: token,
      amount_cents: 500,
      expiration: 3600,
      order_id: orderId,
      billing_data: billingData,
      currency: "EGP",
      integration_id: PAYMOB_INTEGRATION_ID,
      lock_order_when_paid: true
    });
    return response.data.token;
  } catch (error) {
    console.error("❌ Failed to generate payment key:", error.response?.data || error.message);
    throw new Error("Failed to generate payment key");
  }
}

// ============== Middleware للتحقق من HMAC ==============
function verifyHMAC(req, res, next) {
  if (!PAYMOB_HMAC_SECRET) return next();
  
  const receivedHash = req.headers['x-paymob-signature'];
  let data = req.method === 'GET' 
    ? Object.entries(req.query).sort().toString() 
    : req.rawBody;

  const generatedHash = crypto
    .createHmac('sha512', PAYMOB_HMAC_SECRET)
    .update(data)
    .digest('hex');

  if (receivedHash !== generatedHash) {
    console.error('❌ HMAC verification failed');
    return res.status(403).json({ error: "Invalid HMAC signature" });
  }
  next();
}

// ============== Routes محسنة ==============
router.post("/pay", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, amount } = req.body;

    // تحقق من البيانات المطلوبة
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const billingData = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: phone,
      city: "Cairo",
      country: "EG"
    };

    const token = await getAuthToken();
    const orderId = await createOrder(token, amount || 500);
    const paymentToken = await generatePaymentKey(token, orderId, billingData);

    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
    
    paymentStatus.set(orderId.toString(), {
      status: "pending",
      iframeUrl,
      createdAt: new Date()
    });

    res.json({ 
      iframe_url: iframeUrl,
      order_id: orderId,
      status: "pending"
    });

  } catch (err) {
    console.error("❌ Payment initiation error:", err.message);
    res.status(500).json({ 
      error: "Payment failed",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ============== Callbacks محسنة ==============
router.post("/payment-processed", verifyHMAC, async (req, res) => {
  try {
    const { type, obj } = req.body;
    
    if (type !== "TRANSACTION" || !obj?.order?.id) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const { order, success, pending, billing_data } = obj;
    const orderId = order.id.toString();

    if (success && !pending) {
      paymentStatus.set(orderId, { 
        status: "completed",
        completedAt: new Date()
      });

      // إرسال إيميل التأكيد
      await sendConfirmationEmail(
        billing_data?.email || ADMIN_EMAIL,
        billing_data?.first_name || "Customer",
        orderId
      );
    }

    res.status(200).json({ status: "processed" });

  } catch (error) {
    console.error("❌ POST Callback error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/payment-response", verifyHMAC, (req, res) => {
  try {
    const { success, pending, id: orderId } = req.query;
    
    if (success === 'true' && pending === 'false') {
      paymentStatus.set(orderId, { 
        status: "completed",
        completedAt: new Date()
      });
      return res.redirect(`${FRONTEND_URL}/success?order=${orderId}`);
    }
    
    res.redirect(`${FRONTEND_URL}/failed?order=${orderId}`);

  } catch (error) {
    console.error("❌ GET Callback error:", error);
    res.redirect(`${FRONTEND_URL}/error`);
  }
});

// ============== Route لفحص حالة الدفع ==============
router.get("/payment-status/:orderId", (req, res) => {
  const order = paymentStatus.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(order);
});

module.exports = router;