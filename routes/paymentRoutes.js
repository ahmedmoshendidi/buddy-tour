const express = require("express");
const axios = require("axios");
const sendConfirmationEmail = require("../utils/sendConfirmationEmail");

require("dotenv").config();

const router = express.Router();

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY; // حط الـ API Key كامل
const PAYMOB_INTEGRATION_ID = 5174718;
const PAYMOB_IFRAME_ID = 937400; // مهم جدًا

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
    // success_url / error_url مش بتشتغل مع iframe
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

   

    res.json({ iframe_url: iframeUrl });
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

    const billingData = event.obj?.payment_key_claims?.billing_data;

    if (
      event.type === "TRANSACTION" &&
      event.obj?.success === true &&
      billingData
    ) {
      const email = billingData.email || "no-email@unknown.com";
      const name = billingData.first_name || "Guest";

      await sendConfirmationEmail(email, name);
      console.log("✅ Confirmation email sent to:", email);
    } else {
      console.warn("⚠️ Webhook received but payment not successful or missing billing data.");
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error in Webhook handler:", error.message);
    res.status(500).send("Internal Server Error");
  }
});





module.exports = router;
