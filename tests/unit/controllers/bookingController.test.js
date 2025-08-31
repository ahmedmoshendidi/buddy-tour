const { bookTour } = require('../../../controllers/bookingController');

// Mock the database pool
jest.mock('../../../config/database', () => ({
  connect: jest.fn()
}));

const pool = require('../../../config/database');

describe('Booking Controller', () => {
  let mockReq, mockRes, mockClient;

  beforeEach(() => {
    mockReq = {
      body: {
        tourId: 1,
        guideId: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        nationality: 'US',
        date: '2024-01-01',
        time: '10:00',
        numberOfPeople: 2
      }
    };

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };

    pool.connect.mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully book a tour when seats are available', async () => {
    // Mock availability check - 3 people already booked, 15 max capacity
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ total_booked: '3' }] }) // Availability check
      .mockResolvedValueOnce({ rows: [{ id: 123, tour_id: 1 }] }) // Insert booking
      .mockResolvedValueOnce(undefined); // COMMIT

    await bookTour(mockReq, mockRes);

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Tour reserved successfully. Awaiting payment.',
      booking: { id: 123, tour_id: 1 }
    });
    expect(mockClient.release).toHaveBeenCalled();
  });

  test('should reject booking when not enough seats available', async () => {
    // Mock availability check - 14 people already booked, requesting 2 more (exceeds 15)
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ total_booked: '14' }] }) // Availability check
      .mockResolvedValueOnce(undefined); // ROLLBACK

    await bookTour(mockReq, mockRes);

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith({ 
      error: 'Not enough available seats.' 
    });
    expect(mockClient.release).toHaveBeenCalled();
  });

  test('should return 400 for missing required fields', async () => {
    mockReq.body.fullName = ''; // Missing required field

    await bookTour(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ 
      error: 'Missing required fields.' 
    });
    expect(mockClient.release).toHaveBeenCalled();
  });

  test('should handle database errors gracefully', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockRejectedValueOnce(new Error('Database connection failed'))
      .mockResolvedValueOnce(undefined); // ROLLBACK

    await bookTour(mockReq, mockRes);

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ 
      error: 'Server error while booking tour.' 
    });
    expect(mockClient.release).toHaveBeenCalled();
  });

  test('should validate all required fields', async () => {
    const requiredFields = ['tourId', 'date', 'time', 'numberOfPeople', 'fullName', 'email'];
    
    for (const field of requiredFields) {
      mockReq.body = { ...mockReq.body, [field]: '' };
      
      await bookTour(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        error: 'Missing required fields.' 
      });
      
      jest.clearAllMocks();
      pool.connect.mockResolvedValue(mockClient);
    }
  });
});