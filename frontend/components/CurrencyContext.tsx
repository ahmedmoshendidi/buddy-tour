import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  exchangeRates: ExchangeRates;
  convertPrice: (usdPrice: number) => number;
  formatPrice: (usdPrice: number) => string;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

const CURRENCY_SYMBOLS: { [key: string]: string } = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  EGP: 'E£'
};

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrency] = useState<string>('USD');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    CAD: 1.25,
    EGP: 30.5
  });
  const [loading, setLoading] = useState(false);

  // Fetch exchange rates on mount and periodically
  useEffect(() => {
    const fetchExchangeRates = async () => {
      setLoading(true);
      try {
        // Using exchangerate-api.com (free tier allows 1500 requests/month)
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.ok) {
          const data = await response.json();
          setExchangeRates({
            USD: 1,
            EUR: data.rates.EUR || 0.85,
            GBP: data.rates.GBP || 0.73,
            CAD: data.rates.CAD || 1.25,
            EGP: data.rates.EGP || 30.5
          });
        }
      } catch (error) {
        console.warn('Failed to fetch exchange rates, using fallback rates:', error);
        // Keep default rates if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRates();

    // Refresh rates every hour
    const interval = setInterval(fetchExchangeRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Load saved currency from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem('buddytour_currency');
    if (savedCurrency && ['USD', 'EUR', 'GBP', 'CAD', 'EGP'].includes(savedCurrency)) {
      setCurrency(savedCurrency);
    }
  }, []);

  // Save currency to localStorage when changed
  useEffect(() => {
    localStorage.setItem('buddytour_currency', currency);
  }, [currency]);

  const convertPrice = (usdPrice: number): number => {
    return usdPrice * (exchangeRates[currency] || 1);
  };

  const formatPrice = (usdPrice: number): string => {
    const convertedPrice = convertPrice(usdPrice);
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    
    // Format based on currency
    if (currency === 'EGP') {
      return `${symbol}${Math.round(convertedPrice)}`;
    } else {
      return `${symbol}${convertedPrice.toFixed(2)}`;
    }
  };

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    exchangeRates,
    convertPrice,
    formatPrice,
    loading
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};