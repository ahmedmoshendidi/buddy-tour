import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useCurrency } from './CurrencyContext';
import { DollarSign, Loader2 } from 'lucide-react';



const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$',  flag: 'us' },
  { code: 'EUR', name: 'Euro',       symbol: '€',  flag: 'eu' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: 'gb' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: 'ca' },
  { code: 'EGP', name: 'Egyptian Pound',  symbol: 'E£', flag: 'eg' },
];

 const Flag = ({ cc, className = '' }: { cc: string; className?: string }) => (
    <span className={`fi fi-${cc} flag-emoji ${className}`} aria-hidden />
  );

export default function CurrencySelector() {
  const { currency, setCurrency, loading } = useCurrency();
  const selectedCurrency = CURRENCIES.find(c => c.code === currency)!;

  

  return (
    <div className="flex items-center space-x-2">
      <DollarSign className="h-4 w-4 text-muted-foreground" />
      <Select value={currency} onValueChange={setCurrency}>
        <SelectTrigger className="w-[132px] border-0 bg-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0">
          <SelectValue>
            <div className="flex items-center space-x-2">
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Flag cc={selectedCurrency.flag} />
              )}
              <span className="font-medium text-sm">{currency}</span>
            </div>
          </SelectValue>
        </SelectTrigger>

        <SelectContent className="bg-white border border-border shadow-lg z-50">
          {CURRENCIES.map((curr) => (
            <SelectItem key={curr.code} value={curr.code} className="hover:bg-muted focus:bg-muted cursor-pointer">
              <div className="flex items-center space-x-3 w-full">
                <Flag cc={curr.flag} />
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
