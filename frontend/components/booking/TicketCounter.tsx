import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Users, Plus, Minus } from 'lucide-react';
import { useCurrency } from '../CurrencyContext';

interface TicketCounterProps {
  adults: number;
  children: number;
  maxGroupSize: number;
  pricePerPerson: number;
  onUpdateTicketCount: (type: 'adults' | 'children', operation: 'add' | 'subtract') => void;
}

export default function TicketCounter({
  adults,
  children,
  maxGroupSize,
  pricePerPerson,
  onUpdateTicketCount
}: TicketCounterProps) {
  const { formatPrice } = useCurrency();
  
  const totalPeople = adults + children;
  const totalPrice = (adults * pricePerPerson) + (children * pricePerPerson * 0.8);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Select Tickets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adults */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Adults</div>
            <div className="text-sm text-muted-foreground">
              Ages 13+ • {formatPrice(pricePerPerson)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateTicketCount('adults', 'subtract')}
              disabled={adults <= 0}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[20px] text-center">{adults}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateTicketCount('adults', 'add')}
              disabled={totalPeople >= maxGroupSize}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Children */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Children</div>
            <div className="text-sm text-muted-foreground">
              Ages 0-12 • {formatPrice(pricePerPerson * 0.8)} (20% off)
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateTicketCount('children', 'subtract')}
              disabled={children <= 0}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[20px] text-center">{children}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateTicketCount('children', 'add')}
              disabled={totalPeople >= maxGroupSize}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Group Size Warning */}
        {totalPeople > 0 && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {totalPeople} of {maxGroupSize} maximum group size
            </p>
          </div>
        )}

        {/* Total Price */}
        {totalPeople > 0 && (
          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Price</span>
              <span className="text-2xl font-bold text-primary">
                {formatPrice(totalPrice)}
              </span>
            </div>
            {children > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Children receive 20% discount
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}