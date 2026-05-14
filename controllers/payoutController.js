const pool = require('../config/database');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const KASHIER_SECRET_KEY = process.env.KASHIER_SECRET_KEY;
const KASHIER_API_KEY = process.env.KASHIER_API_KEY;
const KASHIER_BASE_URL = process.env.KASHIER_BASE_URL || "https://test-api.kashier.io";
// Note: Payout FEP API often uses a different subdomain in Kashier documentation
const KASHIER_FEP_URL = KASHIER_BASE_URL.includes('test') 
    ? "https://test-fep.kashier.io" 
    : "https://fep.kashier.io";

/**
 * Trigger an automated payout via Kashier
 * @param {number} bookingId 
 */
const triggerAutomatedPayout = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { bookingId } = req.params;

    // 1. Fetch booking and guide bank details
    const result = await client.query(`
      SELECT 
        b.id as booking_id, b.payout_amount, b.order_id,
        g.id as guide_id, g.name as guide_name, g.bank_name, g.bank_account_number, g.account_holder_name
      FROM bookings b
      JOIN guides g ON b.guide_id = g.id
      WHERE b.id = $1 AND b.payment_status = 'paid' AND b.payout_status = 'pending'
    `, [bookingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Eligible booking not found for payout" });
    }

    const booking = result.rows[0];

    // 2. Validate Bank Details
    if (!booking.bank_account_number || !booking.bank_name) {
      return res.status(400).json({ error: "Guide is missing bank details" });
    }

    await client.query('BEGIN');

    // 3. Create Payout Ledger Record
    const payoutResult = await client.query(`
      INSERT INTO payouts (guide_id, booking_id, amount, status)
      VALUES ($1, $2, $3, 'processing')
      RETURNING id
    `, [booking.guide_id, booking.booking_id, booking.payout_amount]);

    const payoutId = payoutResult.rows[0].id;
    const merchantTransferId = `PAY-BT-${booking.booking_id}-${payoutId}`;

    // 4. Call Kashier Payout API (v3)
    console.log(`💸 Triggering Kashier Payout: ${booking.payout_amount} EGP to ${booking.guide_name}`);
    
    try {
      const kashierPayload = {
        amount: parseFloat(booking.payout_amount),
        method: "bank", // Assuming bank transfer
        recipientName: booking.account_holder_name || booking.guide_name,
        merchantTransferId: merchantTransferId,
        recipientBank: booking.bank_name, // Should be the Kashier code (e.g., 'CIB')
        recipientNumber: booking.bank_account_number
      };

      const response = await axios.post(
        `${KASHIER_FEP_URL}/v3/transfers/single`,
        kashierPayload,
        {
          headers: {
            "Authorization": KASHIER_SECRET_KEY,
            "accept": "application/json",
            "Content-Type": "application/json"
          }
        }
      );

      console.log(`✅ Kashier Payout Initiated: ${response.data.data[0].transferId}`);

      // 5. Update status
      await client.query(`
        UPDATE payouts 
        SET gateway_reference = $1, status = 'processing' 
        WHERE id = $2
      `, [response.data.data[0].transferId, payoutId]);

      await client.query(`
        UPDATE bookings SET payout_status = 'processing' WHERE id = $1
      `, [booking.booking_id]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: "Payout initiated successfully",
        transferId: response.data.data[0].transferId,
        merchantTransferId
      });

    } catch (apiErr) {
      console.error("❌ Kashier Payout API Error:", apiErr.response?.data || apiErr.message);
      await client.query('ROLLBACK');
      
      res.status(502).json({ 
        error: "Kashier Payout failed", 
        details: apiErr.response?.data || apiErr.message 
      });
    }

  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error("❌ Payout trigger error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

/**
 * Get bookings that are due for payout (Tour happened > 24 hours ago)
 */
const getDuePayouts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.id, b.full_name, b.email, b.selected_date, b.time_slot, 
        b.payout_amount, b.platform_fee, b.order_id,
        g.name as guide_name, g.bank_name,
        t.title as tour_title
      FROM bookings b
      JOIN guides g ON b.guide_id = g.id
      JOIN tours t ON b.tour_id = t.id
      WHERE b.payment_status = 'paid' 
        AND b.payout_status = 'pending'
        AND (b.selected_date + b.time_slot) < (NOW() - INTERVAL '24 hours')
      ORDER BY b.selected_date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching due payouts:", err);
    res.status(500).json({ error: "Failed to fetch due payouts" });
  }
};

/**
 * Handle Kashier Payout Webhook
 */
const handlePayoutWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-kashier-signature'];
    const { data } = req.body;
    
    if (!data) return res.status(400).send("No data");

    console.log(`📨 Payout Webhook: ${data.merchantTransferId} -> ${data.status}`);

    // Verify signature logic would go here (using HMAC SHA256)

    const status = data.status; // TRANSFERRED, FAILED, etc.
    const merchantTransferId = data.merchantTransferId;

    // Parse bookingId and payoutId from merchantTransferId (PAY-BT-BOOKINGID-PAYOUTID)
    const parts = merchantTransferId.split('-');
    const bookingId = parts[2];
    const payoutId = parts[3];

    if (status === 'TRANSFERRED') {
      await pool.query(`UPDATE payouts SET status = 'paid', processed_at = NOW() WHERE id = $1`, [payoutId]);
      await pool.query(`UPDATE bookings SET payout_status = 'settled' WHERE id = $1`, [bookingId]);
    } else if (status === 'FAILED') {
      await pool.query(`UPDATE payouts SET status = 'failed' WHERE id = $1`, [payoutId]);
      await pool.query(`UPDATE bookings SET payout_status = 'failed' WHERE id = $1`, [bookingId]);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Payout webhook error:", err);
    res.status(500).send("Error");
  }
};

/**
 * Get all payout records (Admin)
 */
const getPayouts = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, g.name as guide_name, b.order_id
            FROM payouts p
            JOIN guides g ON p.guide_id = g.id
            JOIN bookings b ON p.booking_id = b.id
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch payouts" });
    }
};

module.exports = {
  triggerAutomatedPayout,
  handlePayoutWebhook,
  getPayouts,
  getDuePayouts
};
