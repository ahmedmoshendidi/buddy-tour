// paymentRoutes.js
const express = require("express");
const axios = require("axios");
const sendConfirmationEmail = require("../utils/sendConfirmationEmail");
require("dotenv").config();

const router = express.Router();

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;

const paymentStatus = new Map(); // مؤقتًا، لتتبع حالة الطلب

// === Get Paymob Auth Token ===
async function getAuthToken() {
  const response = await axios.post("https://accept.paymob.com/api/auth/tokens", {
    api_key: PAYMOB_API_KEY,
  });
  return response.data.token;
}

// === Create Order ===
async function createOrder(token) {
  const response = await axios.post("https://accept.paymob.com/api/ecommerce/orders", {
    auth_token: token,
    delivery_needed: false,
    amount_cents: 500,
    currency: "EGP",
    items: [],
  });
  return response.data.id;
}

// === Generate Payment Key ===
async function generatePaymentKey(token, orderId, billingData) {
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
}

router.post("/pay", async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;

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

    res.json({ iframe_url: iframeUrl, order_id: orderId });
  } catch (err) {
    console.error("❌ Error during payment:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

router.post("/payment-callback", async (req, res) => {
  console.log("🔥 Webhook Received:");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const event = req.body;
    const orderId = event.obj?.order?.id;
    
    console.log(`📋 Order ID from webhook: ${orderId}`);
    
    if (!orderId) {
      console.error("❌ No order ID found");
      res.status(400).send("No order ID found");
      return;
    }

    console.log(`📋 Transaction pending: ${event.obj?.pending}`);
    console.log(`📋 Transaction success: ${event.obj?.success}`);

    // ✅ شغل في كل الحالات، مش بس لو فيه billingData
    if (
      event.type === "TRANSACTION" &&
      event.obj?.pending === false &&
      event.obj?.success === true
    ) {
      paymentStatus.set(orderId.toString(), "success");
      console.log(`✅ Payment marked as SUCCESS for Order ID: ${orderId}`);

      // ✅ جرب ترسل إيميل بس لو فيه billing data
      const billingData = event.obj?.payment_key_claims?.billing_data;
      if (billingData) {
        const email = billingData.email || "no-email@unknown.com";
        const name = billingData.first_name || "Guest";
        try {
          await sendConfirmationEmail(email, name);
          console.log("✅ Email sent to:", email);
        } catch (emailError) {
          console.error("❌ Email failed:", emailError.message);
        }
      } else {
        console.log("⚠️ No billing data found, skipping email");
      }
    } else {
      paymentStatus.set(orderId.toString(), "fail");
      console.log(`❌ Payment marked as FAILED for Order ID: ${orderId}`);
    }

    console.log("💾 Current statuses:");
    for (const [id, status] of paymentStatus.entries()) {
      console.log(`   ${id} -> ${status}`);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    res.status(500).send("Internal Server Error");
  }
});


module.exports = router;
