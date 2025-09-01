import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { API_PREFIX } from '../config';
import { useCurrency } from './CurrencyContext';
import DateSelector from './booking/DateSelector';
import TimeSelector from './booking/TimeSelector';
import TicketCounter from './booking/TicketCounter';
import PriceDisplay from './booking/PriceDisplay';

interface Tour {
  id: number;
  title: string;
  price_per_person: number;
  max_group_size?: number;
}

interface TimeSlot {
  time: string;
  date: string;
}

interface TicketsQuantityProps {
  tourId: string | number;
  onBack: () => void;
  onCheckout: () => void;
}

export default function TicketsQuantity({ tourId, onBack, onCheckout }: TicketsQuantityProps) {
  const [loading, setLoading] = useState(true);
  const [tour, setTour] = useState<Tour | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [adults, setAdults] = useState<number>(0);
  const [children, setChildren] = useState<number>(0);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [error, setError] = useState<string>('');
  const { formatPrice } = useCurrency();

  // Helper function to extract date from ISO string
  const extractDateFromISO = (isoString: string): string => {
    try {
      // Handle both "2025-08-03T00:00:00.000Z" and "2025-08-03" formats
      return isoString.split('T')[0];
    } catch {
      return isoString;
    }
  };

  useEffect(() => {
    const loadTourData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const isNumericId = /^\d+$/.test(String(tourId));
        const endpoint = isNumericId
          ? `${API_PREFIX}/tours/${tourId}`
          : `${API_PREFIX}/tours/by-slug/${encodeURIComponent(String(tourId))}`;
        
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to load tour`);
        }
        
        const data = await response.json();
        
        if (!data.tour) {
          throw new Error('Tour not found');
        }
        
        // Extract numeric price value for calculations
        let pricePerPerson = data.tour.price_per_person;
        if (typeof pricePerPerson === 'string') {
          pricePerPerson = parseFloat(pricePerPerson.replace('$', ''));
        }
        
        const tourData: Tour = {
          id: data.tour.id,
          title: data.tour.title,
          price_per_person: pricePerPerson,
          max_group_size: data.tour.max_group_size || 12
        };
        
        setTour(tourData);
        
        // Process time slots to normalize date format - ONLY USE DATABASE DATA
        const slots = (data.time_slots || []).map((slot: any) => ({
          ...slot,
          date: extractDateFromISO(slot.date) // Convert ISO to YYYY-MM-DD
        }));
        
        setTimeSlots(slots);
        
        // Get current date for filtering future dates only
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Only show dates that are today or in the future AND have time slots
        const futureSlots = slots.filter((slot: TimeSlot) => slot.date >= todayStr);
        
        if (futureSlots.length > 0) {
          // Check if today has slots
          const todaySlots = futureSlots.filter((slot: TimeSlot) => slot.date === todayStr);
          
          if (todaySlots.length > 0) {
            setSelectedDate(todayStr);
            setSelectedTime(todaySlots[0].time);
          } else {
            // Select first future available date
            const firstDate = futureSlots[0].date;
            const firstDateSlots = futureSlots.filter((slot: TimeSlot) => slot.date === firstDate);
            setSelectedDate(firstDate);
            setSelectedTime(firstDateSlots[0]?.time || '');
          }
        } else {
          // No future slots available - clear selections
          setSelectedDate('');
          setSelectedTime('');
        }
        
      } catch (error: any) {
        console.error('Error loading tour:', error);
        setError(error.message || 'Failed to load tour data');
      } finally {
        setLoading(false);
      }
    };

    loadTourData();
  }, [tourId]);

  const getAvailableTimesForDate = (date: string) => {
    return timeSlots.filter(slot => slot.date === date);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    
    // Clear selected time when changing dates
    setSelectedTime('');
    
    // Auto-select first available time if the new date has slots
    const availableTimesForDate = timeSlots.filter(slot => slot.date === date);
    if (availableTimesForDate.length > 0) {
      setSelectedTime(availableTimesForDate[0].time);
    }
  };

  const changeCount = (type: 'adults' | 'children', delta: number) => {
    if (type === 'adults') {
      setAdults(Math.max(0, adults + delta));
    } else {
      setChildren(Math.max(0, children + delta));
    }
  };

  const handleCheckout = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select a date and time slot first.');
      return;
    }

    if (adults === 0) {
      alert('Please add at least 1 adult.');
      return;
    }

    const bookingInfo = {
      tour_id: tour?.id || tourId,
      date: selectedDate,
      time: selectedTime,
      adults,
      children,
      total_amount: calculateTotal(),
      price_per_person: tour?.price_per_person || 0
    };

    // Store in localStorage for checkout process
    localStorage.setItem('bookingData', JSON.stringify(bookingInfo));

    onCheckout();
  };

  const calculateTotal = (): number => {
    if (!tour) return 0;
    const childPrice = tour.price_per_person * 0.8; // 20% discount for children
    return (adults * tour.price_per_person) + (children * childPrice);
  };

  // Get available times for selected date - ONLY FROM DATABASE
  const availableTimes = selectedDate ? getAvailableTimesForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-amber-50/20 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tour availability...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-amber-50/20 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Button variant="ghost" onClick={onBack} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tour Details
          </Button>
          <Card className="text-center py-20">
            <CardContent>
              <p className="text-destructive mb-4">❌ {error || 'Tour not found'}</p>
              <Button onClick={onBack}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-amber-50/20 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Back Button */}
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tour Details
        </Button>

        <Card className="shadow-lg border border-border/50">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-amber-50 border-b">
            <CardTitle className="text-center">
              <h2 className="text-2xl text-primary">Select Date & Tickets</h2>
              <p className="text-sm text-muted-foreground mt-2">{tour.title}</p>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-8">
            {/* Price Display */}
            <div className="text-center">
              <Badge className="bg-gradient-to-r from-primary to-teal-600 text-white px-4 py-2 text-lg">
                Price from: {formatPrice(tour.price_per_person)} per adult
              </Badge>
            </div>

            {/* Date Selection */}
            <DateSelector
              timeSlots={timeSlots}
              selectedDate={selectedDate}
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              onDateSelect={handleDateSelect}
            />

            {/* Time Selection */}
            <TimeSelector
              availableTimes={availableTimes}
              selectedTime={selectedTime}
              selectedDate={selectedDate}
              onTimeSelect={setSelectedTime}
            />

            {/* Ticket Selection */}
            <TicketCounter
              tour={tour}
              adults={adults}
              children={children}
              onChangeCount={changeCount}
            />

            {/* Total Price */}
            <PriceDisplay
              tour={tour}
              adults={adults}
              children={children}
            />

            {/* Checkout Button */}
            <Button
              size="lg"
              onClick={handleCheckout}
              disabled={!selectedDate || !selectedTime || adults === 0}
              className="w-full bg-gradient-to-r from-primary to-teal-600 hover:from-teal-700 hover:to-teal-700 shadow-lg text-lg py-6"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Proceed to Checkout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}