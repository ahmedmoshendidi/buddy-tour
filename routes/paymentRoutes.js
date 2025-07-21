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
  console.log("🔥 Webhook Received:", JSON.stringify(req.body, null, 2));

  try {
    const event = req.body;
    const orderId = event.obj?.order?.id;

    if (!orderId) {
      console.error("❌ No order ID found in webhook payload");
      return res.status(400).send("No order ID found");
    }

    // تحسين: تسجيل تفاصيل أكثر
    console.log(`📋 Processing webhook for Order ID: ${orderId}`);
    console.log(`📋 Transaction status - Pending: ${event.obj?.pending}, Success: ${event.obj?.success}`);

    if (event.type === "TRANSACTION" && event.obj?.pending === false) {
      if (event.obj?.success === true) {
        paymentStatus.set(orderId.toString(), "success");
        console.log(`✅ Payment SUCCESS for Order ID: ${orderId}`);

        // تحسين: محاولة إرسال إيميل حتى لو لم تكن هناك بيانات شحن
        const email = event.obj?.order?.shipping_data?.email || ADMIN_EMAIL;
        const name = event.obj?.order?.shipping_data?.first_name || "Customer";

        try {
          await sendConfirmationEmail(email, name);
          console.log(`✅ Confirmation email sent to: ${email}`);
        } catch (emailError) {
          console.error("❌ Email sending failed:", emailError.message);
        }
      } else {
        paymentStatus.set(orderId.toString(), "failed");
        console.log(`❌ Payment FAILED for Order ID: ${orderId}`);
      }
    }

    // تحسين: إضافة نقطة فحص للتأكد من استلام البيانات
    console.log("💾 Current payment statuses:");
    paymentStatus.forEach((status, id) => {
      console.log(`   ${id} -> ${status}`);
    });

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error in Webhook handler:", error.message);
    res.status(500).send("Internal Server Error");
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