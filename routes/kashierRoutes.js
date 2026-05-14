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
async function processKashierFulfillment(orderId, status, amount, metaData = null) {
  console.log(`🛠️ Processing Kashier fulfillment for Order: ${orderId}, Status: ${status}, Amount: ${amount}`);
  
  let paymentData = paymentStatus.get(orderId.toString());
  
  // Recovery from metaData if cache is lost (server restart)
  if (!paymentData && metaData) {
    console.log(`ℹ️ paymentData missing from cache for Order: ${orderId}. Attempting recovery from metaData...`);
    try {
      paymentData = {
        billingData: {
          firstName: metaData.firstName || metaData.full_name?.split(' ')[0] || "Customer",
          lastName: metaData.lastName || metaData.full_name?.split(' ').slice(1).join(' ') || "",
          email: metaData.email,
          phone: metaData.phone,
          nationality: metaData.nationality || "Unknown"
        },
        tourId: parseInt(metaData.tourId),
        tourTitle: metaData.tourTitle,
        selectedDate: metaData.date,
        timeSlot: metaData.time,
        peopleCount: {
          adults: parseInt(metaData.adults || 1),
          children: parseInt(metaData.children || 0)
        },
        sessionId: metaData.sessionId,
        amount: parseFloat(amount)
      };
      console.log("✅ Recovered paymentData from metaData");
    } catch (recoveryErr) {
      console.error("❌ Failed to recover paymentData from metaData:", recoveryErr.message);
      return false;
    }
  }

  if (!paymentData) {
    console.warn(`⚠️ paymentData NOT FOUND for Order: ${orderId} (Cache empty and no metaData available).`);
    return false;
  }

  const isSuccess = ["SUCCESS", "captured", "completed", "SUCCESSFUL"].includes(status.toUpperCase());
  if (!isSuccess) {
    console.warn(`⚠️ Status "${status}" is not a success status.`);
    return false;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ✅ Race Condition Prevention: Advisory lock on orderId
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [orderId.toString()]);

    // Idempotency check
    const alreadyProcessed = await client.query(`SELECT 1 FROM payments WHERE order_id = $1`, [orderId.toString()]);
    if (alreadyProcessed.rowCount > 0) {
      console.log(`ℹ️ Order ${orderId} already processed. Skipping.`);
      await client.query('COMMIT');
      return true;
    }

    const { billingData, tourId, tourTitle, selectedDate, timeSlot, peopleCount, sessionId } = paymentData;
    const fullName = `${billingData.firstName} ${billingData.lastName || ''}`.trim();
    const totalPeople = Number(peopleCount.adults) + Number(peopleCount.children);

    // Fetch tour commission and guide info
    const tourRes = await client.query(
      "SELECT commission_percentage, guide_id FROM tours WHERE id = $1",
      [tourId]
    );
    const commissionPercent = tourRes.rows[0]?.commission_percentage || 15.00;
    const guideId = tourRes.rows[0]?.guide_id || 1;

    // Calculate Payouts
    const platformFee = (amount * commissionPercent) / 100;
    const payoutAmount = amount - platformFee;

    // Confirm seat holds
    if (sessionId) {
      const holdConfirm = await client.query(
        `UPDATE seat_holds 
         SET status = 'confirmed', order_id = $1 
         WHERE id = (
           SELECT id FROM seat_holds 
           WHERE session_id = $2 AND status = 'active' 
           LIMIT 1
         )
         RETURNING id, time_slot_id, seats`,
        [orderId.toString(), sessionId]
      );
      if (holdConfirm.rowCount > 0) {
        const hold = holdConfirm.rows[0];
        await client.query(`UPDATE time_slots SET booked_seats = booked_seats + $1, held_seats = held_seats - $1 WHERE id = $2`, [hold.seats, hold.time_slot_id]);
        console.log(`✅ Seat hold confirmed for session: ${sessionId}`);
      }
    }

    // Insert booking with payout details
    const bookingInsert = await client.query(
      `INSERT INTO bookings (
        tour_id, guide_id, full_name, email, phone, nationality, 
        selected_date, time_slot, people_count, order_id,
        payment_status, status, platform_fee, payout_amount, payout_status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7::date,$8,$9,$10, 'paid', 'confirmed', $11, $12, 'pending') RETURNING id`,
      [
        tourId, guideId, fullName, billingData.email, billingData.phone, billingData.nationality, 
        selectedDate, timeSlot, totalPeople, orderId.toString(),
        platformFee, payoutAmount
      ]
    );

    // Record payment
    const amountCents = Math.round(amount * 100);
    await client.query(
      `INSERT INTO payments (order_id, transaction_id, email, full_name, amount_cents, status)
       VALUES ($1,$2,$3,$4,$5,'captured')`,
      [orderId.toString(), orderId.toString(), billingData.email, fullName, amountCents]
    );

    await client.query('COMMIT');
    console.log(`✅ DB transaction committed for Order: ${orderId}. Payout calculated: ${payoutAmount} EGP`);

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
      console.log("✅ Emails sent successfully");
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
        time,
        firstName,
        lastName,
        email,
        phone,
        nationality,
        adults,
        children,
        sessionId: session_id
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
    
    // In production, you'd verify HMAC here.
    console.log("📨 Kashier Webhook received:", JSON.stringify(req.body, null, 2));
    
    const { data } = req.body;
    if (data && (data.status === "SUCCESS" || data.status === "captured")) {
      await processKashierFulfillment(data.merchantOrderId, data.status, data.amount, data.metaData);
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
router.all("/success-return", async (req, res) => {
  const params = req.query;
  const queryString = new URLSearchParams(params).toString();
  console.log("🔄 Kashier Success Return reached. Params:", queryString);

  const orderId = params.merchantOrderId || params.orderId;
  const status = params.paymentStatus || params.status;
  const amount = params.amount;

  if (orderId && status === "SUCCESS") {
    // Fulfillment call (idempotent)
    // Note: Success return doesn't usually include full metadata, but we try anyway
    await processKashierFulfillment(orderId, status, amount);
  }

  res.redirect(`/payment-result?${queryString}`);
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
    let bookingRes = await client.query("SELECT * FROM bookings WHERE order_id = $1", [orderId]);
    
    // Fallback for older bookings without order_id
    if (bookingRes.rows.length === 0) {
      console.log('⚠️ Booking not found by order_id, falling back to email search');
      bookingRes = await client.query(
        "SELECT * FROM bookings WHERE email = $1 AND selected_date >= CURRENT_DATE - INTERVAL '1 day' ORDER BY created_at DESC LIMIT 1", 
        [payment.email]
      );
    }
    
    if (bookingRes.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: "No matching booking found to cancel" });
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
    
    // === REAL KASHIER REFUND API v3 CALL ===
    const REFUND_URL = `${KASHIER_BASE_URL.includes('test') ? 'https://test-fep.kashier.io' : 'https://fep.kashier.io'}/v3/orders/${orderId}`;
    
    console.log(`🚀 Sending v3 PUT refund request to Kashier: ${REFUND_URL}`);
    
    try {
      const kashierResponse = await axios.put(REFUND_URL, {
        apiOperation: "REFUND",
        reason: "Customer cancellation request",
        transaction: {
          amount: parseFloat(refundAmount.toFixed(2))
        }
      }, { 
        headers: { 
          "Authorization": KASHIER_SECRET_KEY, // v3 uses Secret Key
          "Content-Type": "application/json",
          "accept": "application/json"
        } 
      });

      console.log("✅ Kashier v3 Refund Response:", kashierResponse.data);
      
      // Check for success in v3 response structure
      if (kashierResponse.data.status !== "SUCCESS" && kashierResponse.data.response?.status !== "SUCCESS") {
        throw new Error(kashierResponse.data.messages?.en || kashierResponse.data.error?.message || "Refund rejected");
      }
    } catch (apiErr) {
      console.error("❌ Kashier v3 Refund Error:", apiErr.response?.data || apiErr.message);
      return res.status(500).json({ 
        error: "Kashier Refund failed: " + (apiErr.response?.data?.messages?.en || apiErr.response?.data?.error?.message || apiErr.message) 
      });
    }

    // Database updates only if API call succeeded
    await client.query("UPDATE payments SET status = $1, refunded_amount = $2 WHERE order_id = $3", 
      [refundPercentage === 1.0 ? 'fully_refunded' : 'partially_refunded', Math.round(refundAmount * 100), orderId]);
    
    await client.query("UPDATE bookings SET status = 'cancelled' WHERE id = $1", [booking.id]);
    
    client.release();
    res.json({ success: true, refundAmount, percentage: refundPercentage * 100 });
    
  } catch (err) {
    console.error("❌ Refund error:", err.message);
    res.status(500).json({ error: "Refund failed" });
  }
});

module.exports = router;
