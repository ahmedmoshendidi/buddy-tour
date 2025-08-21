import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ExchangeRates { [key: string]: number }

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
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
};

interface CurrencyProviderProps { children: ReactNode }

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', CAD: 'C$', EGP: 'E£'
};

const CODES = ['USD', 'EUR', 'GBP', 'CAD', 'EGP'] as const;
const DEFAULT_RATES: ExchangeRates = { USD: 1, EUR: 0.92, GBP: 0.78, CAD: 1.37, EGP: 48.5 };

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrency] = useState<string>('USD');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(DEFAULT_RATES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchExchangeRates = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/rates'); // من السيرفر بتاعنا -> CSP-safe
        if (!res.ok) throw new Error('bad response');
        const data = await res.json();
        setExchangeRates({ USD: 1, ...data.rates });
      } catch (e) {
        console.warn('Using fallback rates:', e);
        setExchangeRates(DEFAULT_RATES);
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRates();
    const id = setInterval(fetchExchangeRates, 60 * 60 * 1000); // كل ساعة
    return () => clearInterval(id);
  }, []);

  // Load saved currency
  useEffect(() => {
    const saved = localStorage.getItem('buddytour_currency');
    if (saved && CODES.includes(saved as any)) setCurrency(saved);
  }, []);

  // Persist on change
  useEffect(() => {
    localStorage.setItem('buddytour_currency', currency);
  }, [currency]);

  const convertPrice = (usdPrice: number) => usdPrice * (exchangeRates[currency] ?? 1);

  const formatPrice = (usdPrice: number) => {
    const value = convertPrice(usdPrice);
    // استخدام Intl أفضل في الرموز والمسافات
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: currency === 'EGP' ? 0 : 2
    }).format(value);
  };

  const value: CurrencyContextType = {
    currency, setCurrency, exchangeRates, convertPrice, formatPrice, loading
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};
