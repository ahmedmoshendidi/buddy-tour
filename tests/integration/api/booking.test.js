const request = require('supertest');
const express = require('express');
const bookingRoutes = require('../../../routes/bookingRoutes');

// Mock the database
jest.mock('../../../config/database', () => ({
  connect: jest.fn()
}));

const pool = require('../../../config/database');

// Create test app
const app = express();
app.use(express.json());
app.use('/api', bookingRoutes);

describe('Booking API Integration Tests', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/book-tour', () => {
    const validBookingData = {
      tourId: 1,
      guideId: 1,
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      nationality: 'US',
      date: '2024-01-01',
      time: '10:00',
      numberOfPeople: 2
    };

    test('should successfully create a booking', async () => {
      // Mock database responses
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ total_booked: '5' }] }) // Availability check
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 123, 
            tour_id: 1, 
            full_name: 'John Doe',
            email: 'john@example.com',
            status: 'pending',
            payment_status: 'unpaid'
          }] 
        }) // Insert booking
        .mockResolvedValueOnce(undefined); // COMMIT

      const response = await request(app)
        .post('/api/book-tour')
        .send(validBookingData)
        .expect(200);

      expect(response.body.message).toBe('Tour reserved successfully. Awaiting payment.');
      expect(response.body.booking.id).toBe(123);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should reject booking when seats are not available', async () => {
      // Mock availability check showing 14 people already booked
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ total_booked: '14' }] }) // Availability check
        .mockResolvedValueOnce(undefined); // ROLLBACK

      const response = await request(app)
        .post('/api/book-tour')
        .send(validBookingData)
        .expect(409);

      expect(response.body).toEqual({ error: 'Not enough available seats.' });
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should return 400 for missing required fields', async () => {
      const invalidData = { ...validBookingData };
      delete invalidData.fullName;

      const response = await request(app)
        .post('/api/book-tour')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Missing required fields.' });
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should handle database transaction errors', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce(undefined); // ROLLBACK

      const response = await request(app)
        .post('/api/book-tour')
        .send(validBookingData)
        .expect(500);

      expect(response.body).toEqual({ error: 'Server error while booking tour.' });
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should validate request body structure', async () => {
      const testCases = [
        { field: 'tourId', value: null },
        { field: 'date', value: '' },
        { field: 'time', value: '' },
        { field: 'numberOfPeople', value: 0 },
        { field: 'fullName', value: '' },
        { field: 'email', value: '' }
      ];

      for (const testCase of testCases) {
        const invalidData = { ...validBookingData, [testCase.field]: testCase.value };
        
        const response = await request(app)
          .post('/api/book-tour')
          .send(invalidData)
          .expect(400);

        expect(response.body).toEqual({ error: 'Missing required fields.' });
        
        jest.clearAllMocks();
        pool.connect.mockResolvedValue(mockClient);
      }
    });

    test('should handle concurrent booking attempts', async () => {
      // Simulate a race condition where availability changes between check and insert
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ total_booked: '13' }] }) // Shows 2 seats available
        .mockRejectedValueOnce(new Error('violates check constraint')) // Insert fails due to concurrent booking
        .mockResolvedValueOnce(undefined); // ROLLBACK

      const response = await request(app)
        .post('/api/book-tour')
        .send(validBookingData)
        .expect(500);

      expect(response.body).toEqual({ error: 'Server error while booking tour.' });
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});