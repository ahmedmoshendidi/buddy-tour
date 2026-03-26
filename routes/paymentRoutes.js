const express = require("express");
const axios = require("axios");
const path = require("path");
const crypto = require("crypto");
const sendConfirmationEmail = require("../utils/sendConfirmationEmail");
const { getExchangeRates } = require("../services/exchangeRates");
require("dotenv").config();

const { Pool } = require("pg");
const router = express.Router();

// ====== Paymob Config ======
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;

// ====== Paysky Config ======
const PAYSKY_MID = process.env.PAYSKY_MID;
const PAYSKY_TID = process.env.PAYSKY_TID;
const PAYSKY_SECRET = process.env.PAYSKY_SECRET;

const FRONTEND_URL = process.env.FRONTEND_URL;
const DOMAIN = "https://buddytourguide.com";

// ====== DB Connection ======
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ====== Payment Status Cache ======
const paymentStatus = new Map();

// === Format Paysky Date (yyyyMMddHHmm) ===
function formatPayskyDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  const h = pad(date.getUTCHours());
  const min = pad(date.getUTCMinutes());
  return `${y}${m}${d}${h}${min}`;
}

// === Generate Paysky Hash ===
function generatePayskyHash(dateTimeLocalTrxn, amount, merchantReference) {
  const hashingString = `Amount=${amount}&DateTimeLocalTrxn=${dateTimeLocalTrxn}&MerchantId=${PAYSKY_MID}&MerchantReference=${merchantReference}&TerminalId=${PAYSKY_TID}`;
  
  if (!PAYSKY_SECRET) {
    throw new Error("PAYSKY_SECRET is not defined in environment variables");
  }

  const key = Buffer.from(PAYSKY_SECRET, 'hex');
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(hashingString);
  const hash = hmac.digest('hex').toUpperCase();
  
  return hash;
}

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
    return_url: `${FRONTEND_URL}/payment-result`,
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
      session_id, // Include session_id for hold management
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
      country: nationality,
      state: "NA",
    };
    console.log('📥 Received session_id in /pay:', session_id);
    const client = await pool.connect();
    const tourRes = await client.query("SELECT price_per_person, title FROM tours WHERE id = $1", [tour_id]);
    if (tourRes.rows.length === 0) return res.status(400).json({ error: "Invalid tour ID" });

    const basePrice = tourRes.rows[0].price_per_person;
    const tourTitle = tourRes.rows[0].title;
    const totalAmountUSD = basePrice * adults + basePrice * 0.8 * children;

    const ratesResult = await getExchangeRates();
    const egpRate = ratesResult.success ? (ratesResult.data.rates?.EGP || 48.5) : 48.5;
    const totalAmountCents = Math.round(totalAmountUSD * egpRate * 100);

    const token = await getAuthToken();
    const orderId = parseInt(await createOrder(token, totalAmountCents));
    const paymentToken = await generatePaymentKey(token, orderId, billingData, totalAmountCents);

    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;

    paymentStatus.set(orderId.toString(), {
      status: "pending",
      billingData,
      tourId: parseInt(tour_id),
      tourTitle,
      selectedDate: date,
      timeSlot: time,
      peopleCount: { adults, children },
      sessionId: session_id, // Store session_id for hold confirmation
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

    const statusObj = {
      ...existing,
      status: isSuccess ? "captured" : "failed",
      transactionId,
      orderId,
      amountCents: transaction.amount_cents,
      billingData,
      updatedAt: new Date(),
    };

    // Store by both IDs so either can be used for polling
    paymentStatus.set(transactionId.toString(), statusObj);
    paymentStatus.set(orderId.toString(), statusObj);

    if (isSuccess) {
      const client = await pool.connect();
      try {
        // ✅ Start transaction
        await client.query('BEGIN');

        const fullName = `${billingData.first_name} ${billingData.last_name || ''}`.trim();
        const email = billingData.email;
        const phone = billingData.phone_number;
        const nationality = billingData.country || "NA";

        const {
          tourId,
          tourTitle,
          guideId = 1,
          selectedDate,
          timeSlot,
          peopleCount,
          sessionId,
        } = existing || {};

        // Guard: If server was restarted and no existing context, exit safely
        if (!tourId || !selectedDate || !timeSlot || !peopleCount) {
          await client.query('ROLLBACK');
          console.warn('⚠️ Missing booking context for this transaction (server restart before callback?)');
          return;
        }

        const totalPeople = Number(peopleCount.adults || 0) + Number(peopleCount.children || 0);
        if (!Number.isInteger(totalPeople) || totalPeople <= 0) {
          await client.query('ROLLBACK');
          console.warn('⚠️ Invalid totalPeople computed from callback context');
          return;
        }

        // ✅ Idempotency: If this payment was already processed, don't do anything
        const alreadyProcessed = await client.query(
          `SELECT 1 FROM payments WHERE transaction_id = $1`,
          [transactionId]
        );
        if (alreadyProcessed.rowCount > 0) {
          await client.query('COMMIT');
          console.log(`🔄 Transaction ${transactionId} already processed - idempotent`);
          return;
        }

        // 1) Confirm seat hold (converts held_seats to booked_seats)
        if (!sessionId) {
          // Fallback: If no sessionId (legacy flow), record payment as no-hold
          await client.query(
            `INSERT INTO payments (order_id, transaction_id, email, full_name, amount_cents, status)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [orderId, transactionId, email, fullName, transaction.amount_cents, 'captured_no_hold']
          );
          await client.query('COMMIT');
          console.warn(`⚠️ Payment captured but no hold found (legacy flow) for transaction ${transactionId}`);
          return;
        }

        // Confirm the hold - this converts held_seats to booked_seats atomically
        const holdConfirm = await client.query(
          `UPDATE seat_holds 
           SET status = 'confirmed', order_id = $1 
           WHERE session_id = $2 AND status = 'active'
           RETURNING id, time_slot_id, seats`,
          [orderId, sessionId]
        );

        if (holdConfirm.rowCount === 0) {
          // No active hold found - possibly expired
          await client.query(
            `INSERT INTO payments (order_id, transaction_id, email, full_name, amount_cents, status)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [orderId, transactionId, email, fullName, transaction.amount_cents, 'captured_expired_hold']
          );
          await client.query('COMMIT');
          console.error(`❌ Payment captured but hold expired/missing for session ${sessionId}`);
          return;
        }

        const hold = holdConfirm.rows[0];

        // Convert held_seats to booked_seats
        await client.query(
          `UPDATE time_slots 
           SET booked_seats = booked_seats + $1, held_seats = held_seats - $1
           WHERE id = $2`,
          [hold.seats, hold.time_slot_id]
        );

        console.log(`✅ Confirmed hold for ${hold.seats} seats. Hold ID: ${hold.id}`);

        // 2) Create booking record
        const bookingInsert = await client.query(
          `INSERT INTO bookings
           (tour_id, guide_id, full_name, email, phone, nationality, selected_date, time_slot, people_count)
           VALUES ($1,$2,$3,$4,$5,$6,$7::date,$8,$9)
           RETURNING id`,
          [tourId, guideId, fullName, email, phone, nationality, selectedDate, timeSlot, totalPeople]
        );

        // 3) Record payment (protected by UNIQUE constraint on transaction_id)
        await client.query(
          `INSERT INTO payments (order_id, transaction_id, email, full_name, amount_cents, status)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [orderId, transactionId, email, fullName, transaction.amount_cents, 'captured']
        );

        // ✅ If everything passed, commit the transaction
        await client.query('COMMIT');
        console.log(`✅ Transaction ${transactionId} completed successfully. Booking ID: ${bookingInsert.rows[0].id}`);

        // Send email AFTER commit only
        try {
          await sendConfirmationEmail(email, "Booking Confirmation", {
            firstName: billingData.first_name,
            lastName: billingData.last_name || "-",
            tourTitle,
            date: selectedDate,
            time: timeSlot,
            adults: peopleCount.adults,
            children: peopleCount.children,
            amount: transaction.amount_cents / 100,
          });
          console.log("📨 Confirmation email sent.");
        } catch (mailErr) {
          console.warn("✉️ Email send failed (after commit):", mailErr.message);
        }

      } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ DB error in payment callback:", err);
      } finally {
        client.release();
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

// === /api/paysky/pay ===
router.post("/paysky/pay", async (req, res) => {
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
      session_id,
    } = req.body;

    const client = await pool.connect();
    const tourRes = await client.query("SELECT price_per_person, title FROM tours WHERE id = $1", [tour_id]);
    if (tourRes.rows.length === 0) return res.status(400).json({ error: "Invalid tour ID" });

    const basePrice = tourRes.rows[0].price_per_person;
    const tourTitle = tourRes.rows[0].title;
    const totalAmountUSD = basePrice * adults + basePrice * 0.8 * children;

    const ratesResult = await getExchangeRates();
    const egpRate = ratesResult.success ? (ratesResult.data.rates?.EGP || 48.5) : 48.5;
    
    // Paysky Live expects amount as integer in smallest unit (cents/piasters)
    const amountCents = Math.round(totalAmountUSD * egpRate * 100);
    const merchantReference = `BT-${Date.now()}`;
    const trxDateTime = formatPayskyDate(new Date());
    
    console.log('🔐 Generating hash for:', { trxDateTime, amountCents, merchantReference });
    console.log('🔑 PAYSKY_MID:', PAYSKY_MID);
    console.log('🔑 PAYSKY_TID:', PAYSKY_TID);
    console.log('🔑 PAYSKY_SECRET set:', !!PAYSKY_SECRET);

    const secureHash = generatePayskyHash(trxDateTime, amountCents, merchantReference);

    // Store context for callback
    paymentStatus.set(merchantReference, {
      status: "pending",
      billingData: { firstName, lastName, email, phone, nationality },
      tourId: parseInt(tour_id),
      tourTitle,
      selectedDate: date,
      timeSlot: time,
      peopleCount: { adults, children },
      sessionId: session_id,
      amountCents: amountCents, // Store the cents for callback comparison
      createdAt: new Date(),
    });

    client.release();
    
    res.json({
      MID: PAYSKY_MID,
      TID: PAYSKY_TID,
      AmountTrxn: amountCents,
      MerchantReference: merchantReference,
      TrxDateTime: trxDateTime,
      SecureHash: secureHash,
    });
  } catch (err) {
    console.error("❌ Paysky initiation error:", err.message);
    res.status(500).json({ error: "Paysky initiation failed" });
  }
});

// === /api/paysky/callback ===
router.post("/paysky/callback", async (req, res) => {
  // Paysky sends completion data
  const data = req.body;
  console.log('📥 Paysky Callback Received:', data);

  const merchantReference = data.MerchantReference;
  const isSuccess = data.Success === "true" || data.ResponseCode === "000";

  if (!merchantReference) return res.status(400).send("Invalid callback data");

  const existing = paymentStatus.get(merchantReference);
  if (!existing) {
    console.warn('⚠️ No existing context for Paysky reference:', merchantReference);
    return res.status(200).send("OK"); // Still return 200 to acknowledge
  }

  const statusObj = {
    ...existing,
    status: isSuccess ? "captured" : "failed",
    transactionId: data.SystemReference || data.NetworkReference,
    orderId: merchantReference,
    // Callback amount will now be in smallest unit if we sent it that way
    amountCents: parseInt(data.Amount), 
    updatedAt: new Date(),
  };

  paymentStatus.set(merchantReference, statusObj);
  if (data.SystemReference) paymentStatus.set(data.SystemReference.toString(), statusObj);

  if (isSuccess) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        billingData,
        tourId,
        tourTitle,
        selectedDate,
        timeSlot,
        peopleCount,
        sessionId,
      } = existing;

      const fullName = `${billingData.firstName} ${billingData.lastName || ''}`.trim();
      const email = billingData.email;
      const phone = billingData.phone;
      const nationality = billingData.nationality || "NA";

      // Idempotency
      const transactionId = data.SystemReference || data.NetworkReference;
      const alreadyProcessed = await client.query(
        `SELECT 1 FROM payments WHERE transaction_id = $1`,
        [transactionId]
      );
      if (alreadyProcessed.rowCount > 0) {
        await client.query('COMMIT');
        return res.status(200).send("OK");
      }

      if (sessionId) {
        const holdConfirm = await client.query(
          `UPDATE seat_holds 
           SET status = 'confirmed', order_id = $1 
           WHERE session_id = $2 AND status = 'active'
           RETURNING id, time_slot_id, seats`,
          [merchantReference, sessionId]
        );

        if (holdConfirm.rowCount > 0) {
          const hold = holdConfirm.rows[0];
          await client.query(
            `UPDATE time_slots 
             SET booked_seats = booked_seats + $1, held_seats = held_seats - $1
             WHERE id = $2`,
            [hold.seats, hold.time_slot_id]
          );
        }
      }

      const totalPeople = Number(peopleCount.adults || 0) + Number(peopleCount.children || 0);
      const bookingInsert = await client.query(
        `INSERT INTO bookings
         (tour_id, guide_id, full_name, email, phone, nationality, selected_date, time_slot, people_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7::date,$8,$9)
         RETURNING id`,
        [tourId, 1, fullName, email, phone, nationality, selectedDate, timeSlot, totalPeople]
      );

      await client.query(
        `INSERT INTO payments (order_id, transaction_id, email, full_name, amount_cents, status)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [merchantReference, transactionId, email, fullName, Math.round(parseFloat(data.Amount) * 100), 'captured']
      );

      await client.query('COMMIT');

      try {
        await sendConfirmationEmail(email, "Booking Confirmation", {
          firstName: billingData.firstName,
          lastName: billingData.lastName || "-",
          tourTitle,
          date: selectedDate,
          time: timeSlot,
          adults: peopleCount.adults,
          children: peopleCount.children,
          amount: parseFloat(data.Amount),
        });
      } catch (mailErr) {
        console.warn("✉️ Email send failed:", mailErr.message);
      }

    } catch (err) {
      await client.query('ROLLBACK');
      console.error("❌ DB error in Paysky callback:", err);
    } finally {
      client.release();
    }
  }

  res.status(200).send("OK");
});

module.exports = router;
