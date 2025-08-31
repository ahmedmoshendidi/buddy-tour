const request = require('supertest');
const express = require('express');
const bookingRoutes = require('../../../routes/bookingRoutes');

// Mock the database
jest.mock('../../../config/database', () => ({
  query: jest.fn()
}));

const pool = require('../../../config/database');

// Create test app
const app = express();
app.use(express.json());
app.use('/api', bookingRoutes);

describe('Tours API Integration Tests', () => {
  beforeEach(() => {
    pool.query.mockClear();
  });

  describe('GET /api/tours', () => {
    test('should return all tours', async () => {
      const mockTours = [
        { 
          id: 1, 
          title: 'Pyramids Tour', 
          description: 'Visit the Great Pyramids',
          duration: '4 hours',
          price_per_person: 100,
          max_group_size: 15,
          image_urls: ['pyramid1.jpg', 'pyramid2.jpg']
        },
        { 
          id: 2, 
          title: 'Nile Cruise', 
          description: 'Relaxing cruise on the Nile',
          duration: '2 hours',
          price_per_person: 75,
          max_group_size: 20,
          image_urls: ['nile1.jpg']
        }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockTours });

      const response = await request(app)
        .get('/api/tours')
        .expect(200);

      expect(response.body).toEqual({ tours: mockTours });
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, title, description, duration, price_per_person, max_group_size, image_urls FROM tours')
      );
    });

    test('should handle database errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/tours')
        .expect(500);

      expect(response.body).toEqual({ error: 'Server error' });
    });
  });

  describe('GET /api/tours/:id', () => {
    test('should return tour with time slots', async () => {
      const mockTour = {
        id: 1,
        title: 'Pyramids Tour',
        description: 'Visit the Great Pyramids',
        duration: '4 hours',
        max_group_size: 15,
        price_per_person: 100,
        image_urls: ['pyramid1.jpg']
      };

      const mockTimeSlots = [
        { date: '2024-01-01', time: '09:00' },
        { date: '2024-01-01', time: '14:00' },
        { date: '2024-01-02', time: '09:00' }
      ];

      pool.query
        .mockResolvedValueOnce({ rows: [mockTour] })
        .mockResolvedValueOnce({ rows: mockTimeSlots });

      const response = await request(app)
        .get('/api/tours/1')
        .expect(200);

      expect(response.body).toEqual({
        tour: mockTour,
        time_slots: mockTimeSlots
      });
    });

    test('should return 404 for non-existent tour', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/tours/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Tour not found' });
    });
  });

  describe('GET /api/tours/by-slug/:slug', () => {
    test('should return tour by slug', async () => {
      const mockTour = {
        id: 1,
        title: 'Pyramids Tour',
        description: 'Visit the Great Pyramids',
        duration: '4 hours',
        max_group_size: 15,
        price_per_person: 100,
        image_urls: ['pyramid1.jpg']
      };

      const mockTimeSlots = [
        { date: '2024-01-01', time: '09:00' }
      ];

      pool.query
        .mockResolvedValueOnce({ rows: [mockTour] })
        .mockResolvedValueOnce({ rows: mockTimeSlots });

      const response = await request(app)
        .get('/api/tours/by-slug/pyramids-tour')
        .expect(200);

      expect(response.body).toEqual({
        tour: mockTour,
        time_slots: mockTimeSlots
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE slug = $1'),
        ['pyramids-tour']
      );
    });

    test('should return 404 for non-existent slug', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/tours/by-slug/non-existent-tour')
        .expect(404);

      expect(response.body).toEqual({ error: 'Tour not found' });
    });
  });
});