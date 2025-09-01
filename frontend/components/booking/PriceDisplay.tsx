import React from 'react';
import { useCurrency } from '../CurrencyContext';

interface Tour {
  id: number;
  title: string;
  price_per_person: number;
  max_group_size?: number;
}

interface PriceDisplayProps {
  tour: Tour;
  adults: number;
  children: number;
}

export default function PriceDisplay({
  tour,
  adults,
  children
}: PriceDisplayProps) {
  const { formatPrice } = useCurrency();

  const calculateTotal = (): number => {
    if (!tour) return 0;
    const childPrice = tour.price_per_person * 0.8; // 20% discount for children
    return (adults * tour.price_per_person) + (children * childPrice);
  };

  // Don't show if both counters are zero
  if (adults === 0 && children === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary/5 to-teal-50 p-6 rounded-lg border border-primary/20">
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold">Total Price:</span>
        <span className="text-2xl font-bold text-primary">{formatPrice(calculateTotal())}</span>
      </div>
      {(adults > 0 || children > 0) && (
        <div className="text-sm text-muted-foreground mt-2">
          {adults > 0 && `${adults} adult${adults > 1 ? 's' : ''}`}
          {adults > 0 && children > 0 && ' + '}
          {children > 0 && `${children} child${children > 1 ? 'ren' : ''}`}
        </div>
      )}
    </div>
  );
}