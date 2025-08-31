import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useTicketBooking } from '../hooks/useTicketBooking';
import DateTimeSelector from './booking/DateTimeSelector';
import TicketCounter from './booking/TicketCounter';

interface TicketsQuantityProps {
  tourId: number;
  onBack: () => void;
  onCheckout: () => void;
}

export default function TicketsQuantity({ tourId, onBack, onCheckout }: TicketsQuantityProps) {
  const {
    loading,
    tour,
    timeSlots,
    selectedDate,
    selectedTime,
    adults,
    children,
    error,
    totalPeople,
    setSelectedDate,
    setSelectedTime,
    updateTicketCount,
    canProceedToCheckout,
    proceedToCheckout
  } = useTicketBooking(tourId);

  const handleCheckout = () => {
    proceedToCheckout();
    onCheckout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-amber-50/20 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading booking options...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-amber-50/20 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" onClick={onBack} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tour Details
          </Button>
          <Card className="text-center py-20">
            <CardContent>
              <p className="text-destructive mb-4">❌ {error || 'Tour not found'}</p>
              <Button onClick={onBack}>Return to Tour Details</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-amber-50/20 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <Button variant="ghost" onClick={onBack} className="mb-6 hover:bg-white/50">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tour Details
        </Button>

        {/* Tour Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{tour.title}</h1>
          <p className="text-muted-foreground">Choose your preferred date, time, and number of tickets</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Date/Time Selection */}
          <div className="space-y-6">
            <DateTimeSelector
              timeSlots={timeSlots}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onSelectDate={setSelectedDate}
              onSelectTime={setSelectedTime}
            />
          </div>

          {/* Right Column - Ticket Selection */}
          <div className="space-y-6">
            <TicketCounter
              adults={adults}
              children={children}
              maxGroupSize={tour.max_group_size || 12}
              pricePerPerson={tour.price_per_person}
              onUpdateTicketCount={updateTicketCount}
            />

            {/* Proceed Button */}
            <Button
              size="lg"
              onClick={handleCheckout}
              disabled={!canProceedToCheckout()}
              className="w-full bg-gradient-to-r from-primary to-teal-600 hover:from-teal-700 hover:to-teal-700 shadow-lg"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Proceed to Checkout
              {totalPeople > 0 && (
                <span className="ml-2">({totalPeople} ticket{totalPeople > 1 ? 's' : ''})</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}