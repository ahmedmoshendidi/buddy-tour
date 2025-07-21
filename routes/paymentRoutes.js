const express = require("express");
const axios = require("axios");
const sendConfirmationEmail = require("../utils/sendConfirmationEmail");
require("dotenv").config();

const router = express.Router();

// تحسين: جلب كل الإعدادات من ملف البيئة
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "ahmedmoalshendidi@gmail.com";

// تحسين: استخدام خريطة لتتبع حالات الدفع
const paymentStatus = new Map();

// تحسين: إضافة معالجة الأخطاء للوظائف المساعدة
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

async function createOrder(token) {
  try {
    const response = await axios.post("https://accept.paymob.com/api/ecommerce/orders", {
      auth_token: token,
      delivery_needed: false,
      amount_cents: 500,
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

router.post("/pay", async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    // تحسين: إضافة تحقق من البيانات المطلوبة
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const billingData = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: phone,
      apartment: "NA",
      floor: "NA",
      street: "NA",
      building: "NA",
      city: "Cairo",
      country: "EG",
      state: "NA"
    };

    const token = await getAuthToken();
    const orderId = await createOrder(token);
    const paymentToken = await generatePaymentKey(token, orderId, billingData);

    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;

    // تحسين: إضافة حالة الدفع الأولية
    paymentStatus.set(orderId.toString(), "pending");
    console.log(`🔄 Payment initiated for Order ID: ${orderId}`);

    res.json({ 
      iframe_url: iframeUrl, 
      order_id: orderId,
      status: "pending"
    });
  } catch (err) {
    console.error("❌ Error during payment:", err.message);
    res.status(500).json({ 
      error: "Payment initiation failed",
      details: err.message
    });
  }
});

router.post("/payment-callback", async (req, res) => {
  try {
    console.log("🔥 Raw Webhook Data:", JSON.stringify(req.body));
    
    if (!req.body || typeof req.body !== 'object') {
      console.error("❌ Invalid request body");
      return res.status(400).json({ error: "Invalid request body" });
    }

    // تحقق من وجود البيانات الأساسية
    const transactionData = req.body.obj || req.body;
    const orderId = transactionData.order?.id || transactionData.order_id;
    
    if (!orderId) {
      console.error("❌ Missing order ID in payload:", req.body);
      return res.status(400).json({ error: "Order ID is required" });
    }

    console.log(`✅ Valid webhook received for order: ${orderId}`);
    
    // باقي معالجة الدفع...
    res.status(200).json({ success: true, orderId });

  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// تحسين: إضافة نقطة نهاية للتحقق من حالة الدفع
router.get("/payment-status/:orderId", (req, res) => {
  const status = paymentStatus.get(req.params.orderId);
  if (!status) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json({ status });
});

module.exports = router;