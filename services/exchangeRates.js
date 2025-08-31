// Exchange rates service
const fetchAny = global.fetch
  ? (...args) => global.fetch(...args)
  : (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const RATES_URL = "https://api.exchangerate.host/latest?base=USD&symbols=USD,EUR,GBP,CAD,EGP";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Simple in-memory cache
let ratesCache = { ts: 0, data: null };

const getExchangeRates = async () => {
  try {
    // Return from cache if still valid
    if (ratesCache.data && Date.now() - ratesCache.ts < CACHE_TTL_MS) {
      return { success: true, data: ratesCache.data, fromCache: true };
    }

    const response = await fetchAny(RATES_URL, {
      headers: { 'user-agent': 'BuddyTour/1.0' },
    });

    if (!response.ok) {
      throw new Error(`Rates HTTP ${response.status}`);
    }

    const apiData = await response.json();
    const rates = {
      USD: 1,
      EUR: apiData?.rates?.EUR ?? 0.92,
      GBP: apiData?.rates?.GBP ?? 0.78,
      CAD: apiData?.rates?.CAD ?? 1.37,
      EGP: apiData?.rates?.EGP ?? 48.5,
    };

    const payload = {
      base: 'USD',
      provider: 'exchangerate.host',
      updated_at: new Date().toISOString(),
      rates,
    };

    ratesCache = { ts: Date.now(), data: payload };
    return { success: true, data: payload, fromCache: false };

  } catch (error) {
    console.error('Exchange rates fetch error:', error);
    return { 
      success: false, 
      data: {
        base: 'USD',
        provider: 'fallback',
        updated_at: new Date().toISOString(),
        rates: { USD: 1, EUR: 0.92, GBP: 0.78, CAD: 1.37, EGP: 48.5 },
      }
    };
  }
};

module.exports = { getExchangeRates };