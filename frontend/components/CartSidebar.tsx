import React from 'react';
import { useCart } from './CartContext';
import { useCurrency } from './CurrencyContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { ShoppingCart, Clock, Users, Trash2, CreditCard, Calendar } from 'lucide-react';
import CountdownTimer from './ui/CountdownTimer';

// BookedTour interface (matching CartContext)
interface BookedTour {
  id: string;
  tourId: number;
  tourTitle: string;
  date: string;
  time: string;
  adults: number;
  children: number;
  totalAmount: number;
  pricePerPerson: number;
  sessionId: string;
  holdExpiresAt: string;
  createdAt: string;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onPayNow?: () => void;
}

export default function CartSidebar({ 
  isOpen, 
  onClose, 
  onPayNow 
}: CartSidebarProps) {
  const { 
    bookedTours,
    removeBookedTour,
    clearBookedTours,
    getCartTotal
  } = useCart();
  const { formatPrice } = useCurrency();

  const handlePayForItem = (bookedTour: BookedTour) => {
    // Set booking data and navigate to checkout
    const bookingData = {
      tour_id: bookedTour.tourId,
      date: bookedTour.date,
      time: bookedTour.time,
      adults: bookedTour.adults,
      children: bookedTour.children,
      total_amount: bookedTour.totalAmount,
      price_per_person: bookedTour.pricePerPerson,
      session_id: bookedTour.sessionId,
      hold_expires_at: bookedTour.holdExpiresAt
    };
    
    localStorage.setItem('bookingData', JSON.stringify(bookingData));
    onClose();
    
    // Navigate to checkout
    if (onPayNow) {
      onPayNow();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-white">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-primary">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Cart
          </SheetTitle>
          <SheetDescription>
            Your reserved tours - complete booking before timer expires!
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {bookedTours.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No tours in cart</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Book tours and they'll appear here with your reservation timer!
              </p>
              <Button onClick={onClose} variant="outline">
                Browse Tours
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header with clear all */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {bookedTours.length} tour{bookedTours.length !== 1 ? 's' : ''} in cart
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearBookedTours}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              </div>

              {/* Cart Items */}
              <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                {bookedTours.map((bookedTour) => (
                  <CartItemCard 
                    key={bookedTour.id}
                    bookedTour={bookedTour}
                    onRemove={() => removeBookedTour(bookedTour.id)}
                    onPayNow={() => handlePayForItem(bookedTour)}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>

              {/* Cart Total */}
              {bookedTours.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(getCartTotal())}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Cart Item Card Component
interface CartItemCardProps {
  bookedTour: BookedTour;
  onRemove: () => void;
  onPayNow: () => void;
  formatPrice: (amount: number) => string;
}

function CartItemCard({ bookedTour, onRemove, onPayNow, formatPrice }: CartItemCardProps) {
  const isExpired = new Date(bookedTour.holdExpiresAt) <= new Date();

  return (
    <Card className={`overflow-hidden border ${isExpired ? 'border-red-200 bg-red-50' : 'border-border hover:shadow-md'} transition-shadow`}>
      <div className="p-4">
        {/* Tour Title and Remove Button */}
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium text-sm leading-tight">{bookedTour.tourTitle}</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Tour Details */}
        <div className="space-y-2 text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(bookedTour.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{bookedTour.time}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>
              {bookedTour.adults} adult{bookedTour.adults !== 1 ? 's' : ''}
              {bookedTour.children > 0 && `, ${bookedTour.children} child${bookedTour.children !== 1 ? 'ren' : ''}`}
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-primary">
            {formatPrice(bookedTour.totalAmount)}
          </span>
        </div>

        {/* Countdown Timer */}
        {!isExpired && (
          <div className="mb-3">
            <CountdownTimer
              expirationTime={bookedTour.holdExpiresAt}
              className="!p-2 !text-xs"
              onExpire={() => {
                // Timer will show expired state
              }}
            />
          </div>
        )}

        {/* Action Button */}
        {isExpired ? (
          <Button 
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
            disabled
          >
            Hold Expired
          </Button>
        ) : (
          <Button 
            onClick={onPayNow}
            className="w-full bg-gradient-to-r from-primary to-teal-600 hover:from-teal-700 hover:to-teal-700 text-sm py-2"
          >
            <CreditCard className="h-3 w-3 mr-2" />
            Pay Now
          </Button>
        )}
      </div>
    </Card>
  );
}