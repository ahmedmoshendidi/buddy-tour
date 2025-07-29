const express = require("express");
const axios = require("axios");
const path = require("path");
const sendConfirmationEmail = require("../utils/sendConfirmationEmail");
require("dotenv").config();

const { Pool } = require("pg");
const router = express.Router();

// ====== Paymob Config ======
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;
const FRONTEND_URL = process.env.FRONTEND_URL;
const DOMAIN = "https://buddy-tour-production.up.railway.app";

// ====== DB Connection ======
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ====== Payment Status Cache ======
const paymentStatus = new Map();

// === Get Paymob Auth Token ===
async function getAuthToken() {
  const response = await axios.post("https://accept.paymob.com/api/auth/tokens", {
    api_key: PAYMOB_API_KEY,
  });
  return response.data.token;
}

// === Create Order ===
async function createOrder(token, amountCents) {
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
async function generatePaymentKey(token, orderId, billingData, amountCents) {
  const response = await axios.post("https://accept.paymob.com/api/acceptance/payment_keys", {
    auth_token: token,
    amount_cents: amountCents,
    expiration: 3600,
    order_id: orderId,
    billing_data: billingData,
    currency: "EGP",
    integration_id: PAYMOB_INTEGRATION_ID,
    lock_order_when_paid: true,
    return_url: `${FRONTEND_URL}/payment-response.html?id=${orderId}`,
  });
  return response.data.token;
}

// === /api/pay ===
router.post("/pay", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      nationality,
      tour_id,
      date,
      time,
      adults,
      children,
    } = req.body;

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
      state: "NA",
    };

    const client = await pool.connect();
    const tourRes = await client.query("SELECT price_per_person FROM tours WHERE id = $1", [tour_id]);
    if (tourRes.rows.length === 0) return res.status(400).json({ error: "Invalid tour ID" });

    const basePrice = tourRes.rows[0].price_per_person;
    const totalAmountCents = Math.round((basePrice * adults + basePrice * 0.8 * children) * 100);

    const token = await getAuthToken();
    const orderId = parseInt(await createOrder(token, totalAmountCents));
    const paymentToken = await generatePaymentKey(token, orderId, billingData, totalAmountCents);

    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;

    paymentStatus.set(orderId.toString(), {
      status: "pending",
      billingData,
      tourId: parseInt(tour_id),
      selectedDate: date,
      timeSlot: time,
      peopleCount: { adults, children },
      createdAt: new Date(),
    });

    client.release();
    res.json({ iframe_url: iframeUrl, order_id: orderId });
  } catch (err) {
    console.error("❌ Payment error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

// === /api/payment-callback ===
router.post("/payment-callback", async (req, res) => {
  const event = req.body;
  const transaction = event.obj;
  if (!transaction || !transaction.order) return res.status(400).send("Invalid transaction data");

  const transactionId = parseInt(transaction.id);
  const orderId = parseInt(transaction.order.id);

  if (event.type === "TRANSACTION" && !transaction.pending) {
    const isSuccess = transaction.success;
    const billingData = transaction.payment_key_claims?.billing_data || {};
    const existing = paymentStatus.get(orderId.toString()) || {};

    // paymentStatus.set(orderId.toString(), {
    //   ...existing,
    //   status: isSuccess ? "captured" : "failed",
    //   transactionId,
    //   orderId,
    //   amountCents: transaction.amount_cents,
    //   billingData,
    //   updatedAt: new Date(),
    // });

    paymentStatus.set(transactionId.toString(), {
    ...existing,
    status: isSuccess ? "captured" : "failed",
    transactionId,
    orderId,
    amountCents: transaction.amount_cents,
    billingData,
    updatedAt: new Date(),
  });


    if (isSuccess) {
      try {
        const client = await pool.connect();
        const fullName = `${billingData.first_name} ${billingData.last_name}`;
        const email = billingData.email;
        const phone = billingData.phone_number;
        const nationality = billingData.country || "NA";

        const {
          tourId,
          guideId = 1,
          selectedDate,
          timeSlot,
          peopleCount,
        } = existing;

        await client.query(
          `INSERT INTO bookings (tour_id, guide_id, full_name, email, phone, nationality, selected_date, time_slot, people_count)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [tourId, guideId, fullName, email, phone, nationality, selectedDate, timeSlot, peopleCount.adults + peopleCount.children]
        );

        await client.query(
          `INSERT INTO payments (order_id, transaction_id, email, full_name, amount_cents, status)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [orderId, transactionId, email, fullName, transaction.amount_cents, "captured"]
        );

        await sendConfirmationEmail(email, fullName, orderId, transaction.amount_cents / 100);
        console.log("📨 Confirmation email sent.");
        client.release();
      } catch (err) {
        console.error("❌ Error saving to DB or sending email:", err);
      }
    } else {
      console.log(`❌ Payment failed: Transaction ${transactionId}`);
    }
  }
  res.status(200).send("Callback processed");
});

// === /api/payment-status/:transactionId ===
router.get("/payment-status/:transactionId", (req, res) => {
  const { transactionId } = req.params;
  const statusData = paymentStatus.get(transactionId);

  if (!statusData) return res.status(404).json({ error: "Transaction not found" });

  res.json({
    status: statusData.status,
    transactionId: statusData.transactionId,
    orderId: statusData.orderId,
    amount_cents: statusData.amountCents,
  });
});

module.exports = router;
