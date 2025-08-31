// Real database integration tests
// These tests use actual database connections
// Run with: npm run test:integration

const request = require('supertest');
const express = require('express');
const bookingRoutes = require('../../routes/bookingRoutes');
const pool = require('../../config/database');

// Create test app with real database
const app = express();
app.use(express.json());
app.use('/api', bookingRoutes);

describe('Tours API - Real Database Integration', () => {
  // Skip these tests by default to avoid requiring DB setup
  const skipRealDbTests = !process.env.RUN_REAL_DB_TESTS;

  beforeAll(async () => {
    if (skipRealDbTests) {
      console.log('Skipping real DB tests. Set RUN_REAL_DB_TESTS=true to enable.');
      return;
    }
    
    // Setup test data
    await pool.query(`
      INSERT INTO tours (id, title, description, duration, price_per_person, max_group_size, slug) 
      VALUES (9999, 'Test Tour', 'Test Description', '2 hours', 50, 10, 'test-tour-9999')
      ON CONFLICT (id) DO NOTHING
    `);
  });

  afterAll(async () => {
    if (skipRealDbTests) return;
    
    // Cleanup test data
    await pool.query('DELETE FROM tours WHERE id = 9999');
    await pool.end();
  });

  (skipRealDbTests ? test.skip : test)('should fetch tours from real database', async () => {
    const response = await request(app)
      .get('/api/tours')
      .expect(200);

    expect(response.body.tours).toBeDefined();
    expect(Array.isArray(response.body.tours)).toBe(true);
    
    // Should include our test tour
    const testTour = response.body.tours.find(tour => tour.id === 9999);
    expect(testTour).toBeDefined();
    expect(testTour.title).toBe('Test Tour');
  });

  (skipRealDbTests ? test.skip : test)('should fetch specific tour by ID from real database', async () => {
    const response = await request(app)
      .get('/api/tours/9999')
      .expect(200);

    expect(response.body.tour).toBeDefined();
    expect(response.body.tour.id).toBe(9999);
    expect(response.body.tour.title).toBe('Test Tour');
    expect(response.body.time_slots).toBeDefined();
  });
});