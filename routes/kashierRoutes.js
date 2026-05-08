const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();
const { Pool } = require("pg");
const sendConfirmationEmail = require("../utils/sendConfirmationEmail");
const sendAdminBookingNotification = require("../utils/sendAdminBookingNotification");
const { getExchangeRates } = require("../services/exchangeRates");
const path = require("path");

const router = express.Router();

// ====== Kashier Config ======
const KASHIER_MERCHANT_ID = process.env.KASHIER_MERCHANT_ID;
const KASHIER_API_KEY = process.env.KASHIER_API_KEY;
const KASHIER_SECRET_KEY = process.env.KASHIER_SECRET_KEY;
const KASHIER_BASE_URL = process.env.KASHIER_BASE_URL || "https://test-api.kashier.io";
const FRONTEND_URL = process.env.FRONTEND_URL;

// ====== DB Connection ======
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ====== Payment Status Cache (Similar to XPay) ======
const paymentStatus = new Map();

// Helper to process fulfillment
async function processKashierFulfillment(orderId, status, amount) {
  console.log(`🛠️ Processing Kashier fulfillment for Order: ${orderId}, Status: ${status}, Amount: ${amount}`);
  
  const paymentData = paymentStatus.get(orderId.toString());
  if (!paymentData) {
    console.warn(`⚠️ paymentData NOT FOUND in cache for Order: ${orderId}.`);
    return false;
  }

  const isSuccess = ["SUCCESS", "captured", "completed", "SUCCESSFUL"].includes(status.toLowerCase());
  if (!isSuccess) return false;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Idempotency check
    const alreadyProcessed = await client.query(`SELECT 1 FROM payments WHERE order_id = $1`, [orderId.toString()]);
    if (alreadyProcessed.rowCount > 0) {
      await client.query('COMMIT');
      return true;
    }

    const { billingData, tourId, tourTitle, selectedDate, timeSlot, peopleCount, sessionId } = paymentData;
    const fullName = `${billingData.firstName} ${billingData.lastName || ''}`.trim();
    const totalPeople = Number(peopleCount.adults) + Number(peopleCount.children);

    // Confirm seat holds
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

    // Emails
    try {
      const emailVariables = {
        firstName: billingData.firstName,
        lastName: billingData.lastName || "-",
        email: billingData.email,
        phone: billingData.phone,
        nationality: billingData.nationality,
        tourTitle: tourTitle,
        date: selectedDate,
        time: timeSlot,
        adults: peopleCount.adults,
        children: peopleCount.children,
        amount: amount,
        transactionId: orderId,
        orderId: orderId
      };
      console.log("📧 Sending emails for Order:", orderId);
      await sendConfirmationEmail(billingData.email, "Booking Confirmation", emailVariables);
      await sendAdminBookingNotification(emailVariables);
    } catch (mailErr) {
      console.error("✉️ Email failed:", mailErr.message);
    }
    
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ DB error in Kashier fulfillment:", err);
    return false;
  } finally {
    client.release();
  }
}

// === /api/kashier/pay ===
router.post("/pay", async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, nationality,
      tour_id, date, time, adults, children, session_id,
    } = req.body;

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
    const amountEGP = Math.round(totalAmountUSD * egpRate * 100) / 100;

    const orderId = `BT-${Date.now()}`;
    const currentHost = `${req.protocol}://${req.get('host')}`;

    const kashierPayload = {
      amount: amountEGP.toString(),
      currency: "EGP",
      order: orderId,
      merchantRedirect: `${currentHost}/api/kashier/success-return`,
      display: "en",
      type: "one-time",
      allowedMethods: "card,wallet",
      merchantId: KASHIER_MERCHANT_ID,
      customer: {
        email: email,
        reference: session_id || email
      },
      serverWebhook: `${currentHost}/api/kashier/webhook`,
      metaData: {
        tourTitle,
        tourId: tour_id,
        date,
        time
      }
    };

    const response = await axios.post(
      `${KASHIER_BASE_URL}/v3/payment/sessions`,
      kashierPayload,
      { headers: { "Authorization": KASHIER_SECRET_KEY, "api-key": KASHIER_API_KEY } }
    );

    const { sessionUrl } = response.data;

    paymentStatus.set(orderId, {
      status: "pending",
      orderId,
      billingData: { firstName, lastName, email, phone, nationality },
      tourId: parseInt(tour_id),
      tourTitle,
      selectedDate: date,
      timeSlot: time,
      peopleCount: { adults: parseInt(adults), children: parseInt(children) },
      sessionId: session_id,
      amount: amountEGP,
      createdAt: new Date(),
    });

    client.release();
    res.json({ iframe_url: sessionUrl, transaction_uuid: orderId, order_id: orderId });

  } catch (err) {
    console.error("❌ Kashier Payment error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

// === /api/kashier/webhook ===
router.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-kashier-signature"];
    const body = JSON.stringify(req.body);
    
    // In production, you'd verify HMAC here. For now, we process if valid body.
    console.log("📨 Kashier Webhook received:", req.body);
    
    const { data } = req.body;
    if (data && data.status === "SUCCESS") {
      await processKashierFulfillment(data.merchantOrderId, data.status, data.amount);
    }
    
    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Kashier webhook error:", err);
    res.status(500).send("Error");
  }
});

// === /api/kashier/payment-status/:orderId ===
router.get("/payment-status/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const statusData = paymentStatus.get(orderId.toString());

  if (!statusData) {
    // Check DB as fallback
    try {
      const result = await pool.query("SELECT * FROM payments WHERE order_id = $1", [orderId]);
      if (result.rows.length > 0) {
        const payment = result.rows[0];
        return res.json({
          status: payment.status,
          transactionId: payment.transaction_id,
          orderId: payment.order_id,
          amount_cents: payment.amount_cents,
        });
      }
    } catch (err) {
      console.error("DB check failed:", err);
    }
    return res.status(404).json({ error: "Transaction not found" });
  }

  res.json({
    status: statusData.status,
    transactionId: statusData.orderId,
    orderId: statusData.orderId,
    amount_cents: Math.round(statusData.amount * 100),
  });
});

// === /api/kashier/success-return ===
router.all("/success-return", (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  console.log("🔄 Redirecting to payment-response.html with params:", queryString);
  res.redirect(`/payment-response.html?${queryString}`);
});

// === /api/kashier/refund ===
router.post("/refund", async (req, res) => {
  try {
    const { orderId } = req.body;
    
    const client = await pool.connect();
    const paymentRes = await client.query("SELECT * FROM payments WHERE order_id = $1", [orderId]);
    if (paymentRes.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: "Payment not found" });
    }
    
    const payment = paymentRes.rows[0];
    const bookingRes = await client.query("SELECT * FROM bookings WHERE email = $1 AND selected_date >= CURRENT_DATE LIMIT 1", [payment.email]);
    
    if (bookingRes.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: "Booking not found" });
    }
    
    const booking = bookingRes.rows[0];
    const tourDate = new Date(booking.selected_date);
    const now = new Date();
    const hoursDiff = (tourDate - now) / (1000 * 60 * 60);
    
    let refundPercentage = 0;
    if (hoursDiff > 24) {
      refundPercentage = 1.0; // 100%
    } else if (hoursDiff > 0) {
      refundPercentage = 0.8; // 80%
    } else {
      client.release();
      return res.status(400).json({ error: "Cannot refund past tours" });
    }
    
    const refundAmount = (payment.amount_cents / 100) * refundPercentage;
    
    console.log(`💸 Initiating refund for ${orderId}: ${refundPercentage * 100}%, Amount: ${refundAmount}`);
    
    // Call Kashier Refund API
    // Note: Verify the endpoint and method with official docs
    // const refundResponse = await axios.post(`${KASHIER_BASE_URL}/v1/refunds`, {
    //   transactionId: payment.transaction_id,
    //   amount: refundAmount
    // }, { headers: { "Authorization": KASHIER_SECRET_KEY } });
    
    // Mock success for now
    await client.query("UPDATE payments SET status = $1, refunded_amount = $2 WHERE order_id = $3", 
      [refundPercentage === 1.0 ? 'fully_refunded' : 'partially_refunded', refundAmount * 100, orderId]);
    
    await client.query("UPDATE bookings SET status = 'cancelled' WHERE id = $1", [booking.id]);
    
    client.release();
    res.json({ success: true, refundAmount, percentage: refundPercentage * 100 });
    
  } catch (err) {
    console.error("❌ Refund error:", err.message);
    res.status(500).json({ error: "Refund failed" });
  }
});

module.exports = router;
