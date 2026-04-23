const express = require("express");
const axios = require("axios");
require("dotenv").config();
const { Pool } = require("pg");
const sendConfirmationEmail = require("../utils/sendConfirmationEmail");
const sendAdminBookingNotification = require("../utils/sendAdminBookingNotification");
const { getExchangeRates } = require("../services/exchangeRates");
const path = require("path");

const router = express.Router();

// ====== XPay Config ======
const XPAY_API_KEY = process.env.XPAY_API_KEY;
const XPAY_COMMUNITY_ID = process.env.XPAY_COMMUNITY_ID;
const XPAY_VARIABLE_AMOUNT_ID = process.env.XPAY_VARIABLE_AMOUNT_ID;
const XPAY_BASE_URL = process.env.XPAY_BASE_URL || "https://staging.xpay.app";
const FRONTEND_URL = process.env.FRONTEND_URL;

// ====== DB Connection ======
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ====== Payment Status Cache ======
const paymentStatus = new Map();

// Helper to fully process successful payment
async function processXpayFulfillment(transactionUuid, verifiedStatus, amount) {
  const paymentData = paymentStatus.get(transactionUuid.toString());
  if (!paymentData) return false;

  const isSuccess = ["SUCCESSFUL","COMPLETED","completed","successful","SUCCESS","success"].includes(verifiedStatus);
  if (!isSuccess) return false;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Idempotency check
    const alreadyProcessed = await client.query(`SELECT 1 FROM payments WHERE transaction_id = $1`, [transactionUuid.toString()]);
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
        [transactionUuid.toString(), sessionId]
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
      [transactionUuid.toString(), transactionUuid.toString(), billingData.email, fullName, amountCents]
    );

    await client.query('COMMIT');

    paymentStatus.set(transactionUuid.toString(), {
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
    console.error("❌ DB error in XPay fulfillment:", err);
    return false;
  } finally {
    client.release();
  }
}

// === /api/xpay/pay ===
router.post("/pay", async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, nationality,
      tour_id, date, time, adults, children, session_id,
    } = req.body;

    console.log("📥 Received XPay payment request:", { email, tour_id, session_id });

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
    const baseAmount = Math.round(totalAmountUSD * egpRate * 100) / 100;

    const prepareResponse = await axios.post(
      `${XPAY_BASE_URL}/api/v1/payments/prepare-amount/`,
      { community_id: XPAY_COMMUNITY_ID, amount: baseAmount, currency: "EGP", selected_payment_method: "card" },
      { headers: { "Content-Type": "application/json", "x-api-key": XPAY_API_KEY } }
    );

    const totalAmountWithFees = prepareResponse.data.data.total_amount;
    console.log("💰 Total amount including fees:", totalAmountWithFees);

    const currentHost = `${req.protocol}://${req.get('host')}`;

    const xpayPayload = {
      billing_data: {
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone_number: phone,
      },
      amount: totalAmountWithFees,
      currency: "EGP",
      variable_amount_id: parseInt(XPAY_VARIABLE_AMOUNT_ID),
      community_id: XPAY_COMMUNITY_ID,
      pay_using: "card",
      custom_return_url: `${currentHost}/api/xpay/success-return`,
      return_url: `${currentHost}/api/xpay/success-return`
    };

    console.log("💳 Creating XPay payment:", xpayPayload);

    const response = await axios.post(
      `${XPAY_BASE_URL}/api/v1/payments/pay/variable-amount`,
      xpayPayload,
      { headers: { "Content-Type": "application/json", "x-api-key": XPAY_API_KEY } }
    );

    const { iframe_url, transaction_id, transaction_uuid } = response.data.data;

    if (!iframe_url || !transaction_uuid) {
      client.release();
      return res.status(500).json({ error: "Invalid payment response" });
    }

    paymentStatus.set(transaction_uuid.toString(), {
      status: "pending",
      transactionId: transaction_id,
      transactionUuid: transaction_uuid,
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
    res.json({ iframe_url, transaction_id: transaction_uuid, transaction_uuid, order_id: transaction_uuid });

  } catch (err) {
    console.error("❌ XPay Payment error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment initiation failed", details: err.response?.data?.status?.message || err.message });
  }
});

// === /api/xpay/success-return ===
router.all("/success-return", async (req, res) => {
  try {
    console.log("🔄 Redirected from XPay:", { query: req.query, body: req.body });
    const payload = req.method === "POST" ? req.body : req.query;
    const transactionUuid = payload.transaction_id || payload.uuid || payload.order_id || payload.id;

    if (!transactionUuid) {
      return res.redirect(`${FRONTEND_URL}/payment/failure?message=Missing+Transaction+ID`);
    }

    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        response = await axios.get(
          `${XPAY_BASE_URL}/api/v1/communities/${XPAY_COMMUNITY_ID}/transactions/${transactionUuid}`,
          { headers: { "x-api-key": XPAY_API_KEY }, timeout: 15000 }
        );
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (response.data.status?.code === 200 && response.data.data) {
      const transaction = response.data.data;
      const transactionStatus = transaction.status;
      const totalAmount = transaction.total_amount;

      const isSuccess = ["SUCCESSFUL","COMPLETED","completed","successful","SUCCESS","success"].includes(transactionStatus);
      
      if (isSuccess) {
         await processXpayFulfillment(transactionUuid, transactionStatus, totalAmount);
      }
      return res.sendFile(path.join(__dirname, "../public/payment-response.html"));
    } else {
      return res.sendFile(path.join(__dirname, "../public/payment-response.html"));
    }
  } catch (err) {
    console.error("❌ XPay success-return error:", err.message);
    return res.sendFile(path.join(__dirname, "../public/payment-response.html"));
  }
});

// === /api/xpay/callback ===
router.post("/callback", async (req, res) => {
  try {
    console.log("📨 XPay Callback received:", req.body);
    const callbackData = req.body;
    const transactionUuid = callbackData.transaction_id || callbackData.uuid;
    const transactionStatus = callbackData.transaction_status || callbackData.status;
    const totalAmount = callbackData.total_amount;

    if (!transactionUuid) return res.status(200).send("OK - No transaction ID");

    const pData = paymentStatus.get(transactionUuid.toString());
    if (pData) {
      paymentStatus.set(transactionUuid.toString(), {
        ...pData,
        status: transactionStatus?.toLowerCase() || "unknown",
        updatedAt: new Date(),
      });
    }

    const isSuccess = ["SUCCESSFUL","COMPLETED","completed","successful","SUCCESS","success"].includes(transactionStatus);
    if (!isSuccess) return res.status(200).send("OK - Not successful");

    await processXpayFulfillment(transactionUuid, transactionStatus, totalAmount);

    res.status(200).send("OK");
  } catch(err) {
    console.error("❌ XPay callback error:", err);
    res.status(500).send("Error");
  }
});

// === /api/xpay/verify/:transactionId ===
router.get("/verify/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;

    const cached = paymentStatus.get(transactionId.toString());
    if (cached && cached.status) {
      return res.json({ status: cached.status, source: "callback-cache" });
    }

    const response = await axios.get(
      `${XPAY_BASE_URL}/api/v1/communities/${XPAY_COMMUNITY_ID}/transactions/${transactionId}`,
      { headers: { "x-api-key": XPAY_API_KEY } }
    );

    if (response.data.status?.code === 200 && response.data.data) {
      const transaction = response.data.data;
      return res.json({
        status: transaction.status,
        amount: transaction.total_amount,
        currency: transaction.total_amount_currency || "EGP",
        created: transaction.created,
        source: "xpay",
      });
    } else {
      return res.status(404).json({ error: "Transaction not found" });
    }
  } catch (err) {
    console.error("❌ XPay verify error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Verification failed" });
  }
});

// === /api/xpay/payment-status/:transactionId ===
router.get("/payment-status/:transactionId", (req, res) => {
  const { transactionId } = req.params;
  const statusData = paymentStatus.get(transactionId.toString());

  if (!statusData) return res.status(404).json({ error: "Transaction not found" });

  res.json({
    status: statusData.status,
    transactionId: statusData.transactionUuid,
    orderId: statusData.transactionUuid,
    amount_cents: Math.round(statusData.amount * 100),
  });
});

module.exports = router;
