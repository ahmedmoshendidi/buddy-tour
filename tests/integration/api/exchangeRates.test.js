const request = require('supertest');
const express = require('express');
const exchangeRatesRoute = require('../../../routes/exchangeRatesRoute');

// Mock the exchange rates service
jest.mock('../../../services/exchangeRates', () => ({
  getExchangeRates: jest.fn()
}));

const { getExchangeRates } = require('../../../services/exchangeRates');

// Create test app
const app = express();
app.use(express.json());
app.use('/api', exchangeRatesRoute);

describe('Exchange Rates API Integration Tests', () => {
  beforeEach(() => {
    getExchangeRates.mockClear();
  });

  describe('GET /api/rates', () => {
    test('should return current exchange rates', async () => {
      const mockRatesData = {
        base: 'USD',
        provider: 'exchangerate.host',
        updated_at: '2024-01-01T10:00:00.000Z',
        rates: {
          USD: 1,
          EUR: 0.85,
          GBP: 0.75,
          CAD: 1.25,
          EGP: 48.5
        }
      };

      getExchangeRates.mockResolvedValueOnce({
        success: true,
        data: mockRatesData,
        fromCache: false
      });

      const response = await request(app)
        .get('/api/rates')
        .expect(200);

      expect(response.body).toEqual(mockRatesData);
      expect(response.headers['cache-control']).toBe('public, max-age=3600');
      expect(getExchangeRates).toHaveBeenCalledTimes(1);
    });

    test('should return cached rates with proper headers', async () => {
      const mockRatesData = {
        base: 'USD',
        provider: 'exchangerate.host',
        updated_at: '2024-01-01T09:30:00.000Z',
        rates: {
          USD: 1,
          EUR: 0.85,
          GBP: 0.75,
          CAD: 1.25,
          EGP: 48.5
        }
      };

      getExchangeRates.mockResolvedValueOnce({
        success: true,
        data: mockRatesData,
        fromCache: true
      });

      const response = await request(app)
        .get('/api/rates')
        .expect(200);

      expect(response.body).toEqual(mockRatesData);
      expect(response.headers['cache-control']).toBe('public, max-age=3600');
    });

    test('should return fallback rates when API fails', async () => {
      const fallbackRatesData = {
        base: 'USD',
        provider: 'fallback',
        updated_at: '2024-01-01T10:00:00.000Z',
        rates: {
          USD: 1,
          EUR: 0.92,
          GBP: 0.78,
          CAD: 1.37,
          EGP: 48.5
        }
      };

      getExchangeRates.mockResolvedValueOnce({
        success: false,
        data: fallbackRatesData
      });

      const response = await request(app)
        .get('/api/rates')
        .expect(200);

      expect(response.body).toEqual(fallbackRatesData);
      expect(response.headers['cache-control']).toBe('no-store');
    });

    test('should handle service errors gracefully', async () => {
      getExchangeRates.mockRejectedValueOnce(new Error('Service unavailable'));

      const response = await request(app)
        .get('/api/rates')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch exchange rates' });
    });

    test('should work with both /rates and /rates/ endpoints', async () => {
      const mockRatesData = {
        base: 'USD',
        provider: 'exchangerate.host',
        updated_at: '2024-01-01T10:00:00.000Z',
        rates: { USD: 1, EUR: 0.85, GBP: 0.75, CAD: 1.25, EGP: 48.5 }
      };

      getExchangeRates.mockResolvedValue({
        success: true,
        data: mockRatesData
      });

      // Test /rates
      await request(app)
        .get('/api/rates')
        .expect(200);

      // Test /rates/
      await request(app)
        .get('/api/rates/')
        .expect(200);

      expect(getExchangeRates).toHaveBeenCalledTimes(2);
    });

    test('should validate response data structure', async () => {
      const mockRatesData = {
        base: 'USD',
        provider: 'exchangerate.host',
        updated_at: '2024-01-01T10:00:00.000Z',
        rates: {
          USD: 1,
          EUR: 0.85,
          GBP: 0.75,
          CAD: 1.25,
          EGP: 48.5
        }
      };

      getExchangeRates.mockResolvedValueOnce({
        success: true,
        data: mockRatesData
      });

      const response = await request(app)
        .get('/api/rates')
        .expect(200);

      // Validate required fields
      expect(response.body).toHaveProperty('base', 'USD');
      expect(response.body).toHaveProperty('provider');
      expect(response.body).toHaveProperty('updated_at');
      expect(response.body).toHaveProperty('rates');

      // Validate rates structure
      expect(response.body.rates).toHaveProperty('USD', 1);
      expect(response.body.rates).toHaveProperty('EUR');
      expect(response.body.rates).toHaveProperty('GBP');
      expect(response.body.rates).toHaveProperty('CAD');
      expect(response.body.rates).toHaveProperty('EGP');

      // Validate data types
      Object.values(response.body.rates).forEach(rate => {
        expect(typeof rate).toBe('number');
        expect(rate).toBeGreaterThan(0);
      });
    });
  });
});