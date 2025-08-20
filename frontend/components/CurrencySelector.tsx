import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useCurrency } from './CurrencyContext';
import { DollarSign, Loader2 } from 'lucide-react';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', symbol: 'C$' },
  { code: 'EGP', name: 'Egyptian Pound', flag: '🇪🇬', symbol: 'E£' }
];

export default function CurrencySelector() {
  const { currency, setCurrency, loading } = useCurrency();

  const selectedCurrency = CURRENCIES.find(c => c.code === currency);

  return (
    <div className="flex items-center space-x-2">
      <DollarSign className="h-4 w-4 text-muted-foreground" />
      <Select value={currency} onValueChange={setCurrency}>
        <SelectTrigger className="w-[120px] border-0 bg-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0">
          <SelectValue>
            <div className="flex items-center space-x-2">
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span className="text-sm">{selectedCurrency?.flag}</span>
              )}
              <span className="font-medium text-sm">{currency}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-white border border-border shadow-lg z-50">
          {CURRENCIES.map((curr) => (
            <SelectItem 
              key={curr.code} 
              value={curr.code}
              className="hover:bg-muted focus:bg-muted cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-base">{curr.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{curr.code}</span>
                  <span className="text-xs text-muted-foreground">{curr.name}</span>
                </div>
                <span className="text-sm text-muted-foreground ml-auto">{curr.symbol}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}