const pool = require('../config/database');

// Get tour by ID
const getTourById = async (req, res) => {
  const { id } = req.params;

  try {
    const tourRes = await pool.query(
      `SELECT id, title, description, duration, max_group_size, price_per_person, image_urls, slug FROM tours WHERE id = $1`,
      [id]
    );

    if (tourRes.rows.length === 0) {
      return res.status(404).json({ error: "Tour not found" });
    }

    const timeSlotsRes = await pool.query(
      `SELECT date, time, capacity, booked_seats, available_spots FROM time_slots WHERE tour_id = $1 ORDER BY date, time`,
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
};

// Get tour by slug
const getTourBySlug = async (req, res) => {
  const { slug } = req.params;
  
  try {
    const tourRes = await pool.query(
      `SELECT id, title, description, duration, max_group_size, price_per_person, image_urls, slug
       FROM tours
       WHERE slug = $1
       LIMIT 1`,
      [slug]
    );

    if (tourRes.rows.length === 0) {
      return res.status(404).json({ error: 'Tour not found' });
    }

    const tourId = tourRes.rows[0].id;

    const timeSlotsRes = await pool.query(
      `SELECT date, time, capacity, booked_seats, available_spots
       FROM time_slots
       WHERE tour_id = $1
       ORDER BY date, time`,
      [tourId]
    );

    return res.json({
      tour: tourRes.rows[0],
      time_slots: timeSlotsRes.rows,
    });
  } catch (err) {
    console.error('Error loading tour by slug:', err);
    return res.status(500).json({ error: 'Server error while loading tour by slug.' });
  }
};

// Get all tours
const getAllTours = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, duration, price_per_person, max_group_size, image_urls, slug FROM tours`
    );
    res.json({ tours: result.rows });
  } catch (err) {
    console.error("Error fetching tours:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getTourById,
  getTourBySlug,
  getAllTours
};