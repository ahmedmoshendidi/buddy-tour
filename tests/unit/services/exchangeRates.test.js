const { getExchangeRates } = require('../../../services/exchangeRates');

// Mock global fetch
global.fetch = jest.fn();

describe('Exchange Rates Service', () => {
  beforeEach(() => {
    fetch.mockClear();
    // Clear the module cache to reset the internal cache
    jest.resetModules();
    // Re-require the module to get fresh cache
    delete require.cache[require.resolve('../../../services/exchangeRates')];
  });

  test('should return cached rates if cache is valid', async () => {
    const { getExchangeRates } = require('../../../services/exchangeRates');
    
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        rates: { EUR: 0.85, GBP: 0.75, CAD: 1.25, EGP: 50.0 }
      })
    });

    // First call should fetch from API
    const result1 = await getExchangeRates();
    expect(result1.success).toBe(true);
    expect(result1.fromCache).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const result2 = await getExchangeRates();
    expect(result2.success).toBe(true);
    expect(result2.fromCache).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1); // Still only called once
  });

  test('should return fallback rates on API failure', async () => {
    const { getExchangeRates } = require('../../../services/exchangeRates');
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await getExchangeRates();
    
    expect(result.success).toBe(false);
    expect(result.data.provider).toBe('fallback');
    expect(result.data.rates.USD).toBe(1);
    expect(result.data.rates.EGP).toBe(48.5);
  });

  test('should handle invalid API response', async () => {
    const { getExchangeRates } = require('../../../services/exchangeRates');
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const result = await getExchangeRates();
    
    expect(result.success).toBe(false);
    expect(result.data.provider).toBe('fallback');
  });

  test('should format rates correctly from API', async () => {
    const { getExchangeRates } = require('../../../services/exchangeRates');
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        rates: { EUR: 0.88, GBP: 0.79, CAD: 1.35, EGP: 49.5 }
      })
    });

    const result = await getExchangeRates();
    
    expect(result.success).toBe(true);
    expect(result.data.base).toBe('USD');
    expect(result.data.provider).toBe('exchangerate.host');
    expect(result.data.rates.USD).toBe(1);
    expect(result.data.rates.EUR).toBe(0.88);
    expect(result.data.rates.EGP).toBe(49.5);
  });
});