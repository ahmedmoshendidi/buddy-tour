const { getTourById, getTourBySlug, getAllTours } = require('../../../controllers/tourController');

// Mock the database pool
jest.mock('../../../config/database', () => ({
  query: jest.fn()
}));

const pool = require('../../../config/database');

describe('Tour Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    pool.query.mockClear();
  });

  describe('getTourById', () => {
    test('should return tour with time slots when tour exists', async () => {
      mockReq.params = { id: '1' };
      
      const mockTour = {
        id: 1,
        title: 'Test Tour',
        description: 'A test tour',
        duration: '2 hours',
        max_group_size: 10,
        price_per_person: 50,
        image_urls: ['test.jpg']
      };

      const mockTimeSlots = [
        { date: '2024-01-01', time: '10:00' },
        { date: '2024-01-01', time: '14:00' }
      ];

      pool.query
        .mockResolvedValueOnce({ rows: [mockTour] })
        .mockResolvedValueOnce({ rows: mockTimeSlots });

      await getTourById(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(mockRes.json).toHaveBeenCalledWith({
        tour: mockTour,
        time_slots: mockTimeSlots
      });
    });

    test('should return 404 when tour not found', async () => {
      mockReq.params = { id: '999' };
      
      pool.query.mockResolvedValueOnce({ rows: [] });

      await getTourById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Tour not found" });
    });

    test('should handle database errors', async () => {
      mockReq.params = { id: '1' };
      
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await getTourById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        error: "Server error while loading tour data." 
      });
    });
  });

  describe('getTourBySlug', () => {
    test('should return tour when slug exists', async () => {
      mockReq.params = { slug: 'test-tour' };
      
      const mockTour = {
        id: 1,
        title: 'Test Tour',
        description: 'A test tour',
        duration: '2 hours',
        max_group_size: 10,
        price_per_person: 50,
        image_urls: ['test.jpg']
      };

      const mockTimeSlots = [
        { date: '2024-01-01', time: '10:00' }
      ];

      pool.query
        .mockResolvedValueOnce({ rows: [mockTour] })
        .mockResolvedValueOnce({ rows: mockTimeSlots });

      await getTourBySlug(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE slug = $1'),
        ['test-tour']
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        tour: mockTour,
        time_slots: mockTimeSlots
      });
    });
  });

  describe('getAllTours', () => {
    test('should return all tours', async () => {
      const mockTours = [
        { id: 1, title: 'Tour 1', description: 'Desc 1' },
        { id: 2, title: 'Tour 2', description: 'Desc 2' }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockTours });

      await getAllTours(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ tours: mockTours });
    });

    test('should handle database errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await getAllTours(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });
});