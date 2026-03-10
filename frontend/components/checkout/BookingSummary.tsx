import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { MapPin, Star, Calendar, Users } from 'lucide-react';
import { useCurrency } from '../CurrencyContext';
import { FormData } from '../../hooks/useCheckoutForm';

interface BookingSummaryProps {
  formData: FormData;
  tourTitle?: string;
}

export default function BookingSummary({ formData, tourTitle }: BookingSummaryProps) {
  const { formatPrice, currency, exchangeRates } = useCurrency();

  const adults = formData.adults || 0;
  const children = formData.children || 0;
  const totalPeople = adults + children;
  const pricePerPerson = formData.price_per_person || 0;
  const totalAmount = formData.total_amount || (pricePerPerson * totalPeople);

  const formatEGP = (usdPrice: number) => {
    const value = usdPrice * (exchangeRates['EGP'] || 48.5);
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'EGP',
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tour Details */}
        <div className="space-y-3">
          <h3 className="font-medium text-foreground">
            {tourTitle || 'Alexandria Walking Tour'}
          </h3>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-current text-amber-400" />
            <span>4.8 (100+ reviews)</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Alexandria, Egypt</span>
          </div>

          {formData.date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formData.date} at {formData.time || 'TBD'}</span>
            </div>
          )}

          {totalPeople > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {adults > 0 && `${adults} adult${adults > 1 ? 's' : ''}`}
                {adults > 0 && children > 0 && ', '}
                {children > 0 && `${children} child${children > 1 ? 'ren' : ''}`}
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Pricing Breakdown */}
        <div className="space-y-2">
          {adults > 0 && (
            <div className="flex justify-between text-sm">
              <span>{adults} Adult{adults > 1 ? 's' : ''}</span>
              <span>{formatPrice(pricePerPerson * adults)}</span>
            </div>
          )}
          
          {children > 0 && (
            <div className="flex justify-between text-sm">
              <span>{children} Child{children > 1 ? 'ren' : ''}</span>
              <span>{formatPrice(pricePerPerson * children * 0.8)}</span>
            </div>
          )}

          <Separator />
          
          <div className="flex justify-between font-medium text-base">
            <span>Total</span>
            <div className="text-right">
              <span className="text-primary block">{formatPrice(totalAmount)}</span>
              {currency !== 'EGP' && (
                <span className="text-sm text-muted-foreground block">
                  {formatEGP(totalAmount)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-xs text-muted-foreground">
            ✓ Free cancellation up to 24 hours before the tour
          </p>
          <p className="text-xs text-muted-foreground">
            ✓ Instant confirmation
          </p>
        </div>
      </CardContent>
    </Card>
  );
}