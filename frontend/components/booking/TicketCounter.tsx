import React from 'react';
import { Button } from '../ui/button';
import { Users, Plus, Minus } from 'lucide-react';
import { useCurrency } from '../CurrencyContext';

interface Tour {
  id: number;
  title: string;
  price_per_person: number;
  max_group_size?: number;
}

interface TicketCounterProps {
  tour: Tour;
  adults: number;
  children: number;
  onChangeCount: (type: 'adults' | 'children', delta: number) => void;
}

export default function TicketCounter({
  tour,
  adults,
  children,
  onChangeCount
}: TicketCounterProps) {
  const { formatPrice } = useCurrency();

  return (
    <div>
      <h3 className="text-lg mb-4 text-primary flex items-center">
        <Users className="h-5 w-5 mr-2" />
        Select Tickets & Quantity
      </h3>
      
      <div className="space-y-4">
        {/* Adults */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-white to-teal-50/30">
          <div>
            <div className="font-medium">Adults (15+)</div>
            <div className="text-sm text-muted-foreground">{formatPrice(tour.price_per_person)} per person</div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onChangeCount('adults', -1)}
              disabled={adults === 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-semibold">{adults}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onChangeCount('adults', 1)}
              disabled={adults + children >= (tour.max_group_size || 12)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Children */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-white to-amber-50/30">
          <div>
            <div className="font-medium">Children (&lt;15)</div>
            <div className="text-sm text-muted-foreground">
              {formatPrice(tour.price_per_person * 0.8)} per child (20% discount)
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onChangeCount('children', -1)}
              disabled={children === 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-semibold">{children}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onChangeCount('children', 1)}
              disabled={adults + children >= (tour.max_group_size || 12)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}