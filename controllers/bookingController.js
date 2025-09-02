const pool = require('../config/database');

// Book a tour
const bookTour = async (req, res) => {
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
};

// Check seat availability for a specific time slot
const checkAvailability = async (req, res) => {
  try {
    const { tour_id, date, time, requested_people } = req.query;

    if (!tour_id || !date || !time || !requested_people) {
      return res.status(400).json({ 
        error: 'Missing required parameters: tour_id, date, time, requested_people' 
      });
    }

    // Get availability from time_slots table
    const availabilityRes = await pool.query(
      `SELECT capacity, booked_seats, available_spots 
       FROM time_slots 
       WHERE tour_id = $1 AND date = $2::date AND time = $3::time`,
      [tour_id, date, time]
    );

    if (availabilityRes.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Time slot not found' 
      });
    }

    const { capacity, booked_seats, available_spots } = availabilityRes.rows[0];
    const requestedPeople = parseInt(requested_people);
    const canBook = available_spots >= requestedPeople;

    res.json({
      capacity,
      booked_seats,
      available_spots,
      requested_people: requestedPeople,
      can_book: canBook,
      message: canBook 
        ? `${requestedPeople} seats available for booking`
        : `Only ${available_spots} seats available, but ${requestedPeople} requested`
    });

  } catch (err) {
    console.error('Availability check error:', err);
    res.status(500).json({ error: 'Server error while checking availability' });
  }
};

// Create soft hold for seats (30 minutes)
const createSeatHold = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { tour_id, date, time, seats, session_id } = req.body;
    
    if (!tour_id || !date || !time || !seats || !session_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Missing required fields: tour_id, date, time, seats, session_id' 
      });
    }

    const requestedSeats = parseInt(seats);
    if (!Number.isInteger(requestedSeats) || requestedSeats <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid seats count' });
    }

    // 1. Find the time_slot_id and check availability
    const timeSlotRes = await client.query(
      `SELECT id, capacity, booked_seats, held_seats, available_spots
       FROM time_slots 
       WHERE tour_id = $1 AND date = $2::date AND time = $3::time`,
      [tour_id, date, time]
    );

    if (timeSlotRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Time slot not found' });
    }

    const timeSlot = timeSlotRes.rows[0];
    const timeSlotId = timeSlot.id;

    // 2. Check if enough seats are available (excluding current session's hold)
    await client.query(
      'DELETE FROM seat_holds WHERE session_id = $1 AND status = $2',
      [session_id, 'active']
    );
    
    // Recalculate availability after removing old hold
    const updatedAvailability = await client.query(
      'SELECT available_spots FROM time_slots WHERE id = $1',
      [timeSlotId]
    );
    
    const availableSeats = updatedAvailability.rows[0].available_spots;
    
    if (availableSeats < requestedSeats) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        error: 'Insufficient seats available',
        available: availableSeats,
        requested: requestedSeats
      });
    }

    // 3. Create hold (expires in 30 minutes)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    const holdRes = await client.query(
      `INSERT INTO seat_holds (time_slot_id, seats, session_id, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, expires_at`,
      [timeSlotId, requestedSeats, session_id, expiresAt]
    );

    // 4. Update held_seats in time_slots
    await client.query(
      'UPDATE time_slots SET held_seats = held_seats + $1 WHERE id = $2',
      [requestedSeats, timeSlotId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      hold_id: holdRes.rows[0].id,
      expires_at: holdRes.rows[0].expires_at,
      message: `${requestedSeats} seats reserved for 30 minutes`
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create hold error:', err);
    res.status(500).json({ error: 'Failed to create seat hold' });
  } finally {
    client.release();
  }
};

// Confirm hold and convert to booking
const confirmSeatHold = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { session_id, order_id } = req.body;
    
    if (!session_id || !order_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Missing session_id or order_id' });
    }

    // Find active hold
    const holdRes = await client.query(
      `SELECT id, time_slot_id, seats, expires_at
       FROM seat_holds 
       WHERE session_id = $1 AND status = 'active'`,
      [session_id]
    );

    if (holdRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'No active hold found for this session' });
    }

    const hold = holdRes.rows[0];

    // Check if hold hasn't expired
    if (new Date() > new Date(hold.expires_at)) {
      await client.query('ROLLBACK');
      return res.status(410).json({ error: 'Hold has expired' });
    }

    // 1. Update hold status to confirmed and add order_id
    await client.query(
      `UPDATE seat_holds 
       SET status = 'confirmed', order_id = $1 
       WHERE id = $2`,
      [order_id, hold.id]
    );

    // 2. Convert held_seats to booked_seats
    await client.query(
      `UPDATE time_slots 
       SET booked_seats = booked_seats + $1, held_seats = held_seats - $1
       WHERE id = $2`,
      [hold.seats, hold.time_slot_id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Hold confirmed and converted to booking`
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Confirm hold error:', err);
    res.status(500).json({ error: 'Failed to confirm seat hold' });
  } finally {
    client.release();
  }
};

// Release hold (cancel/timeout)
const releaseSeatHold = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { session_id } = req.body;
    
    if (!session_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Missing session_id' });
    }

    // Find active hold
    const holdRes = await client.query(
      `SELECT id, time_slot_id, seats
       FROM seat_holds 
       WHERE session_id = $1 AND status = 'active'`,
      [session_id]
    );

    if (holdRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'No active hold found' });
    }

    const hold = holdRes.rows[0];

    // 1. Update hold status to released
    await client.query(
      'UPDATE seat_holds SET status = $1 WHERE id = $2',
      ['released', hold.id]
    );

    // 2. Release held seats
    await client.query(
      'UPDATE time_slots SET held_seats = held_seats - $1 WHERE id = $2',
      [hold.seats, hold.time_slot_id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Hold released successfully'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Release hold error:', err);
    res.status(500).json({ error: 'Failed to release seat hold' });
  } finally {
    client.release();
  }
};

// Cleanup expired holds (background job)
const cleanupExpiredHolds = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Find all expired active holds
    const expiredHolds = await client.query(
      `SELECT id, time_slot_id, seats
       FROM seat_holds 
       WHERE expires_at < NOW() AND status = 'active'`
    );

    let cleanedCount = 0;

    for (const hold of expiredHolds.rows) {
      // Update hold status to expired
      await client.query(
        'UPDATE seat_holds SET status = $1 WHERE id = $2',
        ['expired', hold.id]
      );

      // Release held seats
      await client.query(
        'UPDATE time_slots SET held_seats = held_seats - $1 WHERE id = $2',
        [hold.seats, hold.time_slot_id]
      );

      cleanedCount++;
    }

    await client.query('COMMIT');

    if (res) {
      res.json({
        success: true,
        cleaned_holds: cleanedCount,
        message: `Cleaned up ${cleanedCount} expired holds`
      });
    }

    console.log(`🧹 Cleaned up ${cleanedCount} expired seat holds`);
    return cleanedCount;

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Cleanup expired holds error:', err);
    if (res) {
      res.status(500).json({ error: 'Failed to cleanup expired holds' });
    }
  } finally {
    client.release();
  }
};

module.exports = {
  bookTour,
  checkAvailability,
  createSeatHold,
  confirmSeatHold,
  releaseSeatHold,
  cleanupExpiredHolds
};