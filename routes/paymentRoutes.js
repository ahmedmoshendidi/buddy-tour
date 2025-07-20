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

// router.post("/payment-callback", async (req, res) => {
//   console.log("🔥 Webhook Received:");
//   console.log(JSON.stringify(req.body, null, 2));

//   try {
//     const event = req.body;
//     const orderId =
//       event.obj?.payment_key_claims?.order_id ||
//       event.obj?.order?.id ||
//       event.obj?.order?.merchant_order_id;

//     const billingData = event.obj?.payment_key_claims?.billing_data;

//     if (
//       event.type === "TRANSACTION" &&
//       event.obj?.success === true &&
//       billingData &&
//       orderId
//     ) {
//       paymentStatus.set(orderId, "success");

//       const email = billingData.email || "no-email@unknown.com";
//       const name = billingData.first_name || "Guest";

//       await sendConfirmationEmail(email, name);
//       console.log("✅ Confirmation email sent to:", email);
//     } else if (orderId) {
//       paymentStatus.set(orderId, "fail");
//     }

//     res.sendStatus(200);
//   } catch (error) {
//     console.error("❌ Error in Webhook handler:", error.message);
//     res.status(500).send("Internal Server Error");
//   }
// });

// // Check payment status
// router.get("/payment-status/:orderId", (req, res) => {
//   const status = paymentStatus.get(req.params.orderId);
//   res.json({ status: status || "pending" });
// });

router.post("/payment-callback", async (req, res) => {
  console.log("🔥 Webhook Received:");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const event = req.body;
    
    // ✅ الـ transaction ID الحقيقي من الـ webhook
    const webhookOrderId = event.obj?.id;
    
    // ✅ الـ acquirer ID من داخل الـ data (ده اللي يطابق الـ polling)
    const acquirerOrderId = event.obj?.data?.migs_transaction?.acquirer?.id;
    
    console.log(`📋 Webhook Order ID: ${webhookOrderId}`);
    console.log(`📋 Acquirer Order ID: ${acquirerOrderId}`);
    
    // ✅ استخدم الـ acquirer ID عشان يطابق الـ polling
    const orderId = acquirerOrderId || webhookOrderId;
    
    if (!orderId) {
      console.error("❌ No order ID found in webhook payload");
      console.log("🔍 Available IDs:", {
        webhook_id: webhookOrderId,
        acquirer_id: acquirerOrderId,
        payment_claims_order_id: event.obj?.payment_key_claims?.order_id,
        order_id: event.obj?.order?.id
      });
      res.status(400).send("No order ID found");
      return;
    }

    const billingData = event.obj?.payment_key_claims?.billing_data;
    
    console.log(`📋 Using Order ID: ${orderId} for status update`);
    console.log(`📋 Transaction pending: ${event.obj?.pending}`);
    console.log(`📋 Transaction success check: pending=${event.obj?.pending}, type=${event.type}`);

    if (
      event.type === "TRANSACTION" &&
      event.obj?.pending === false  // ✅ لما pending يبقى false يعني نجح
    ) {
      // ✅ حدث الحالة للـ success
      paymentStatus.set(orderId.toString(), "success");
      console.log(`✅ Payment marked as SUCCESS for Order ID: ${orderId}`);

      if (billingData) {
        const email = billingData.email || "no-email@unknown.com";
        const name = billingData.first_name || "Guest";

        try {
          await sendConfirmationEmail(email, name);
          console.log("✅ Confirmation email sent to:", email);
        } catch (emailError) {
          console.error("❌ Email sending failed:", emailError.message);
        }
      }
    } else if (event.obj?.pending === true) {
      // لسه معلق
      paymentStatus.set(orderId.toString(), "pending");
      console.log(`⏳ Payment still PENDING for Order ID: ${orderId}`);
    } else {
      // فشل أو حالة غير معروفة
      paymentStatus.set(orderId.toString(), "fail");
      console.log(`❌ Payment marked as FAILED for Order ID: ${orderId}`);
    }

    // ✅ طباعة حالة كل الـ payments للتشخيص
    console.log("💾 Current payment statuses:");
    for (const [id, status] of paymentStatus.entries()) {
      console.log(`   ${id} -> ${status}`);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error in Webhook handler:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
