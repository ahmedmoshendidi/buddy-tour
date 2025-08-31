// Jest setup file
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.PAYMOB_HMAC_SECRET = 'test-secret';

// Mock console.error to avoid cluttering test output
global.console = {
  ...console,
  error: jest.fn(),
};