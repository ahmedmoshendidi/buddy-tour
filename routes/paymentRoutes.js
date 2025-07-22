const express = require("express");
const axios = require("axios");
const path = require("path");
const sendConfirmationEmail = require("../utils/sendConfirmationEmail");
require("dotenv").config();

const router = express.Router();

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;
const DOMAIN = "https://buddy-tour-production.up.railway.app";

const paymentStatus = new Map();

// === Get Paymob Auth Token ===
async function getAuthToken() {
  const response = await axios.post("https://accept.paymob.com/api/auth/tokens", {
    api_key: PAYMOB_API_KEY,
  });
  return response.data.token;
}

// === Create Order ===
async function createOrder(token, amountCents = 500) {
  const response = await axios.post("https://accept.paymob.com/api/ecommerce/orders", {
    auth_token: token,
    delivery_needed: false,
    amount_cents: amountCents,
    currency: "EGP",
    items: [],
  });
  return response.data.id;
}

// === Generate Payment Key ===
const FRONTEND_URL = process.env.FRONTEND_URL;

async function generatePaymentKey(token, orderId, billingData) {
  const response = await axios.post("https://accept.paymob.com/api/acceptance/payment_keys", {
    auth_token: token,
    amount_cents: 500,
    expiration: 3600,
    order_id: orderId,
    billing_data: billingData,
    currency: "EGP",
    integration_id: PAYMOB_INTEGRATION_ID,
    lock_order_when_paid: true,
    return_url: `${FRONTEND_URL}/payment-response.html?id=${orderId}`
  });
  return response.data.token;
}

// === /api/pay ===
router.post("/pay", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, nationality } = req.body;

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
    const orderId = await createOrder(token, 500);
    const returnUrl = `${DOMAIN}/payment-response.html?order_id=${orderId}`;
    const paymentToken = await generatePaymentKey(token, orderId, billingData, returnUrl);

    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;

    paymentStatus.set(orderId.toString(), {
      status: "pending",
      billingData,
      createdAt: new Date()
    });

    res.json({ iframe_url: iframeUrl, order_id: orderId });
  } catch (err) {
    console.error("❌ Payment error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

// === /api/payment-callback ===
router.post("/payment-callback", async (req, res) => {
  console.log("🔥 Webhook received:", JSON.stringify(req.body, null, 2));

  const event = req.body;
  const transaction = event.obj;

  if (!transaction || !transaction.order) {
    return res.status(400).send("Invalid transaction data");
  }

  const orderId = transaction.order.id.toString();

  if (event.type === "TRANSACTION" && !transaction.pending) {
    const isSuccess = transaction.success;

    const existing = paymentStatus.get(orderId) || {};
    paymentStatus.set(orderId, {
      ...existing,
      status: isSuccess ? "success" : "failed",
      transactionId: transaction.id,
      amountCents: transaction.amount_cents,
      updatedAt: new Date()
    });

    if (isSuccess) {
      console.log(`✅ Payment success: Order ${orderId}`);

      try {
        const data = paymentStatus.get(orderId);
        const { billingData } = data;

        if (billingData?.email) {
          await sendConfirmationEmail(
            billingData.email,
            `${billingData.first_name} ${billingData.last_name}`,
            orderId,
            transaction.amount_cents / 100
          );
          console.log("📨 Confirmation email sent.");
        } else {
          console.warn("⚠️ No billing data available for email.");
        }
      } catch (emailErr) {
        console.error("❌ Failed to send confirmation email:", emailErr);
      }
    } else {
      console.log(`❌ Payment failed: Order ${orderId}`);
    }
  }

  res.status(200).send("Callback processed");
});

// === /api/payment-status/:orderId ===
router.get("/payment-status/:orderId", (req, res) => {
  const { orderId } = req.params;
  const statusData = paymentStatus.get(orderId);

  if (!statusData) {
    return res.status(404).json({ error: "Order not found" });
  }

  res.json({ 
    status: statusData.status,
    transactionId: statusData.transactionId || null
  });
});

// routes/paymentRoutes.js
router.get("/payment-response", async (req, res) => {
  try {
    const query = req.query;
    const orderId = query.id;

    if (query.success === "true") {
      const paymentData = paymentStatus.get(orderId);

      if (paymentData && paymentData.billingData) {
        const { billingData } = paymentData;

        await sendConfirmationEmail(
          billingData.email,
          `${billingData.first_name} ${billingData.last_name}`,
          orderId,
          paymentData.amountCents / 100
        );

        console.log("📨 Email sent from payment-response");

        
        return res.redirect("/success.html");

      } else {
        console.warn("⚠️ No billing data found for order:", orderId);
      }
    }

    
    return res.redirect("/fail.html");


  } catch (error) {
    console.error("Redirect error:", error);
    return res.redirect("/fail.html");

  }
});



module.exports = router;
