const express = require("express");
const axios = require("axios");
require("dotenv").config();
const { Pool } = require("pg");
const sendConfirmationEmail = require("../utils/sendConfirmationEmail");
const sendAdminBookingNotification = require("../utils/sendAdminBookingNotification");
const { getExchangeRates } = require("../services/exchangeRates");
const path = require("path");

const router = express.Router();

// ====== Noon Config ======
const NOON_BUSINESS_ID = process.env.NOON_BUSINESS_ID || "buddy_tour";
const NOON_APP_NAME = process.env.NOON_APP_NAME || "buddy_tour_api";
const NOON_APP_KEY = process.env.NOON_APP_KEY || "6378ea4ed3734b3193ffe7edfe4db13f";
const NOON_AUTH_HEADER = "Key YnVkZHlfdG91ci5idWRkeV90b3VyX2FwaTo2Mzc4ZWE0ZWQzNzM0YjMxOTNmZmU3ZWRmZTRkYjEzZg==";
// Force the staging URL to the Egypt test server to ignore any wrong environment variables
const NOON_BASE_URL = "https://api-test.eg.noonpayments.com";
const FRONTEND_URL = process.env.FRONTEND_URL;

// ====== DB Connection ======
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ====== Payment Status Cache ======
const paymentStatus = new Map();

// Helper to fully process successful payment
async function processNoonFulfillment(orderId, verifiedStatus, amount) {
  const paymentData = paymentStatus.get(orderId.toString());
  if (!paymentData) return false;

  // Noon payments successful statuses: CAPTURED, AUTHORIZED, SALE
  const isSuccess = ["SUCCESSFUL", "COMPLETED", "completed", "successful", "SUCCESS", "success", "CAPTURED", "SALE", "AUTHORIZED"].includes(verifiedStatus.toUpperCase());
  if (!isSuccess) return false;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Idempotency check
    const alreadyProcessed = await client.query(`SELECT 1 FROM payments WHERE order_id = $1`, [orderId.toString()]);
    if (alreadyProcessed.rowCount > 0) {
      await client.query('COMMIT');
      return true; // Already handled
    }

    const { billingData, tourId, tourTitle, selectedDate, timeSlot, peopleCount, sessionId } = paymentData;
    const fullName = `${billingData.firstName} ${billingData.lastName || ''}`.trim();
    const totalPeople = Number(peopleCount.adults) + Number(peopleCount.children);

    // Confirm seat holds if sessionId exists
    if (sessionId) {
      const holdConfirm = await client.query(
        `UPDATE seat_holds SET status = 'confirmed', order_id = $1 WHERE session_id = $2 AND status = 'active' RETURNING id, time_slot_id, seats`,
        [orderId.toString(), sessionId]
      );
      if (holdConfirm.rowCount > 0) {
        const hold = holdConfirm.rows[0];
        await client.query(`UPDATE time_slots SET booked_seats = booked_seats + $1, held_seats = held_seats - $1 WHERE id = $2`, [hold.seats, hold.time_slot_id]);
      }
    }

    // Insert booking
    const bookingInsert = await client.query(
      `INSERT INTO bookings (tour_id, guide_id, full_name, email, phone, nationality, selected_date, time_slot, people_count)
       VALUES ($1,1,$2,$3,$4,$5,$6::date,$7,$8) RETURNING id`,
      [tourId, fullName, billingData.email, billingData.phone, billingData.nationality, selectedDate, timeSlot, totalPeople]
    );

    // Record payment
    const amountCents = Math.round(amount * 100);
    await client.query(
      `INSERT INTO payments (order_id, transaction_id, email, full_name, amount_cents, status)
       VALUES ($1,$2,$3,$4,$5,'captured')`,
      [orderId.toString(), orderId.toString(), billingData.email, fullName, amountCents]
    );

    await client.query('COMMIT');

    paymentStatus.set(orderId.toString(), {
      ...paymentData,
      status: "successful",
      updatedAt: new Date(),
    });

    // Send confirmation email & notification
    try {
      const emailVariables = {
        firstName: billingData.firstName,
        lastName: billingData.lastName || "-",
        email: billingData.email,
        phone: billingData.phone,
        nationality: billingData.nationality,
        tourTitle,
        date: selectedDate,
        time: timeSlot,
        adults: peopleCount.adults,
        children: peopleCount.children,
        amount: amount,
      };
      await sendConfirmationEmail(billingData.email, "Booking Confirmation", emailVariables);
      await sendAdminBookingNotification(emailVariables);
      console.log("📨 Confirmation & Admin emails sent.");
    } catch (mailErr) {
      console.warn("✉️ Email send failed:", mailErr.message);
    }

    return true;

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ DB error in Noon fulfillment:", err);
    return false;
  } finally {
    client.release();
  }
}

// === /api/noon/pay ===
router.post("/pay", async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, nationality,
      tour_id, date, time, adults, children, session_id,
    } = req.body;

    console.log("📥 Received Noon payment request:", { email, tour_id, session_id });

    const client = await pool.connect();

    const tourRes = await client.query("SELECT price_per_person, title FROM tours WHERE id = $1", [tour_id]);
    if (tourRes.rows.length === 0) {
      client.release();
      return res.status(400).json({ error: "Invalid tour ID" });
    }

    const basePrice = tourRes.rows[0].price_per_person;
    const tourTitle = tourRes.rows[0].title;
    const totalAmountUSD = basePrice * adults + basePrice * 0.8 * children;

    const ratesResult = await getExchangeRates();
    const egpRate = ratesResult.success ? (ratesResult.data.rates?.EGP || 48.5) : 48.5;
    const totalAmountWithFees = Math.round(totalAmountUSD * egpRate * 100) / 100;

    const currentHost = `${req.protocol}://${req.get('host')}`;
    const orderReference = `BTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const noonPayload = {
      apiOperation: "INITIATE",
      order: {
        reference: orderReference,
        amount: totalAmountWithFees.toFixed(2),
        currency: "EGP",
        name: tourTitle.substring(0, 100), // Max 100 chars
        channel: "Web",
        category: "Pay"
      },
      configuration: {
        returnUrl: `${currentHost}/api/noon/success-return`
      }
    };

    console.log("💳 Creating Noon payment:", noonPayload);

    const response = await axios.post(
      `${NOON_BASE_URL}/payment/v1/order`,
      noonPayload,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": NOON_AUTH_HEADER
        }
      }
    );

    const result = response.data;

    if (result.resultCode === 0 && result.result && result.result.checkoutData && result.result.checkoutData.postUrl) {
      const checkoutUrl = result.result.checkoutData.postUrl;
      const orderId = result.result.order.id;

      paymentStatus.set(orderId.toString(), {
        status: "pending",
        orderId: orderId,
        billingData: { firstName, lastName, email, phone, nationality },
        tourId: parseInt(tour_id),
        tourTitle,
        selectedDate: date,
        timeSlot: time,
        peopleCount: { adults: parseInt(adults), children: parseInt(children) },
        sessionId: session_id,
        amount: totalAmountWithFees,
        createdAt: new Date(),
      });

      client.release();
      res.json({ iframe_url: checkoutUrl, transaction_id: orderId, order_id: orderId });
    } else {
      client.release();
      console.error("Invalid response from noon:", result);
      return res.status(500).json({ error: "Invalid payment response from Noon" });
    }

  } catch (err) {
    console.error("❌ Noon Payment error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment initiation failed", details: err.response?.data?.message || err.message });
  }
});

// === /api/noon/success-return ===
router.all("/success-return", async (req, res) => {
  try {
    console.log("🔄 Redirected from Noon:", { query: req.query, body: req.body });
    const payload = req.method === "POST" ? req.body : req.query;
    const orderId = payload.orderId || req.query.orderId;

    if (!orderId) {
      return res.redirect(`${FRONTEND_URL}/payment/failure?message=Missing+Order+ID`);
    }

    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        response = await axios.get(
          `${NOON_BASE_URL}/payment/v1/order/${orderId}`,
          { headers: { "Authorization": NOON_AUTH_HEADER }, timeout: 15000 }
        );
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    const result = response.data;
    if (result.resultCode === 0 && result.result && result.result.order) {
      // We no longer call processNoonFulfillment here because the user strictly requested 
      // that the fulfillment only happens inside the /callback webhook function.
      return res.sendFile(path.join(__dirname, "../public/payment-response.html"));
    } else {
      return res.sendFile(path.join(__dirname, "../public/payment-response.html"));
    }
  } catch (err) {
    console.error("❌ Noon success-return error:", err.message);
    return res.sendFile(path.join(__dirname, "../public/payment-response.html"));
  }
});

// === /api/noon/callback ===
router.post("/callback", async (req, res) => {
  try {
    console.log("📨 Noon Callback received:", req.body);
    
    // Noon sends a JWT in req.body.data
    const jwt = req.body.data;
    if (!jwt) return res.status(200).send("OK - No JWT in body");

    // Decode the JWT payload (the second part of the token)
    const payloadBase64 = jwt.split('.')[1];
    const callbackData = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
    console.log("🔓 Decoded Webhook Payload:", callbackData);

    const orderId = callbackData.orderId;

    if (!orderId) return res.status(200).send("OK - No order ID");

    // Let's fetch the actual status to be secure
    const response = await axios.get(
      `${NOON_BASE_URL}/payment/v1/order/${orderId}`,
      { headers: { "Authorization": NOON_AUTH_HEADER }, timeout: 15000 }
    );

    const result = response.data;
    if (result.resultCode === 0 && result.result && result.result.order) {
      let orderStatus = result.result.order.status;
      const totalAmount = result.result.order.amount;
      const currency = result.result.order.currency || "EGP";

      // ⚡ Auto-Capture Logic
      if (orderStatus === "AUTHORIZED" || orderStatus === "3DS_RESULT_VERIFIED") {
        const operation = orderStatus === "AUTHORIZED" ? "CAPTURE" : "SALE";
        console.log(`⚡ Attempting Auto-${operation} for order: ${orderId} with status: ${orderStatus}`);
        try {
          const capturePayload = {
            apiOperation: operation,
            order: { id: orderId },
            transaction: { amount: totalAmount.toString(), currency: currency }
          };
          const capResponse = await axios.post(
            `${NOON_BASE_URL}/payment/v1/order`,
            capturePayload,
            { headers: { "Content-Type": "application/json", "Authorization": NOON_AUTH_HEADER } }
          );
          if (capResponse.data.resultCode === 0 && capResponse.data.result.order) {
            orderStatus = capResponse.data.result.order.status;
            console.log(`✅ Auto-capture successful. New status: ${orderStatus}`);
          } else {
            console.warn(`⚠️ Auto-capture returned non-zero code:`, capResponse.data);
          }
        } catch (capErr) {
          console.error(`❌ Auto-capture failed:`, capErr.response?.data || capErr.message);
        }
      }

      const pData = paymentStatus.get(orderId.toString());
      if (pData) {
        paymentStatus.set(orderId.toString(), {
          ...pData,
          status: orderStatus?.toLowerCase() || "unknown",
          updatedAt: new Date(),
        });
      }

      const isSuccess = ["SUCCESSFUL", "COMPLETED", "completed", "successful", "SUCCESS", "success", "CAPTURED", "SALE"].includes(orderStatus.toUpperCase());
      if (!isSuccess) {
          console.log(`Order ${orderId} is not successful yet. Current Status: ${orderStatus}`);
          return res.status(200).send("OK - Not successful");
      }

      await processNoonFulfillment(orderId, orderStatus, totalAmount);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Noon callback error:", err);
    res.status(500).send("Error");
  }
});

// === /api/noon/payment-status/:orderId ===
router.get("/payment-status/:orderId", (req, res) => {
  const { orderId } = req.params;
  const statusData = paymentStatus.get(orderId.toString());

  if (!statusData) return res.status(404).json({ error: "Order not found" });

  res.json({
    status: statusData.status,
    orderId: statusData.orderId,
    amount_cents: Math.round(statusData.amount * 100),
  });
});

module.exports = router;
