const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

// الاتصال بقاعدة البيانات المستضافة على Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// POST /api/book-tour
router.post('/book-tour', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      tourId,
      guideId,
      fullName,
      email,
      phone,
      nationality,
      date,
      time,
      numberOfPeople,
    } = req.body;

    if (!tourId || !date || !time || !numberOfPeople || !fullName || !email) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    await client.query('BEGIN');

    const checkRes = await client.query(
      `
      SELECT COALESCE(SUM(number_of_people), 0) AS total_booked
      FROM bookings
      WHERE tour_id = $1 AND date = $2 AND time = $3
      FOR UPDATE
      `,
      [tourId, date, time]
    );

    const totalBooked = parseInt(checkRes.rows[0].total_booked);
    const maxGroupSize = 15;

    if (totalBooked + numberOfPeople > maxGroupSize) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Not enough available seats.' });
    }

    const insertRes = await client.query(
      `
      INSERT INTO bookings (
        tour_id, guide_id, full_name, email, phone, nationality,
        date, time, number_of_people, payment_status, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, 'unpaid', 'pending'
      ) RETURNING *
      `,
      [
        tourId, guideId, fullName, email, phone, nationality,
        date, time, numberOfPeople,
      ]
    );

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Tour reserved successfully. Awaiting payment.',
      booking: insertRes.rows[0],
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Server error while booking tour.' });
  } finally {
    client.release();
  }
});

// GET /api/tours/:id
router.get("/tours/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const tourRes = await pool.query(
      `SELECT id, title, description, price_per_person FROM tours WHERE id = $1`,
      [id]
    );

    if (tourRes.rows.length === 0) {
      return res.status(404).json({ error: "Tour not found" });
    }

    const timeSlotsRes = await pool.query(
      `SELECT date, time FROM time_slots WHERE tour_id = $1 ORDER BY date, time`,
      [id]
    );

    res.json({
      tour: tourRes.rows[0],
      time_slots: timeSlotsRes.rows,
    });

  } catch (err) {
    console.error("Error loading tour:", err);
    res.status(500).json({ error: "Server error while loading tour data." });
  }
});

module.exports = router;
