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
import { useCart } from './CartContext';

interface Tour {
  id: number;
  slug: string;
  title: string;
  price_per_person: number;
  max_group_size?: number;
}

interface TimeSlot {
  time: string;
  date: string;
  capacity?: number;
  booked_seats?: number;
  available_spots?: number;
  language?: string;
}

interface TicketsQuantityProps {
  tourId: string | number;
  onBack: () => void;
  onCheckout: (bookingInfo: any) => void;
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
  const [availabilityError, setAvailabilityError] = useState<string>('');
  const [availabilityLoading, setAvailabilityLoading] = useState<boolean>(false);
  const [holdLoading, setHoldLoading] = useState<boolean>(false);
  const [holdExpiration, setHoldExpiration] = useState<Date | null>(null);
  const { formatPrice } = useCurrency();
  const { addBookedTour } = useCart();

  // Generate or retrieve session ID for this booking session
  const [sessionId] = useState<string>(() => {
    // First try to get existing session from localStorage
    const storageKey = `buddy_tour_session_${tourId}`;
    const existingSession = localStorage.getItem(storageKey);
    
    if (existingSession) {
      return existingSession;
    }
    
    // Generate new session ID
    const newSession = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(storageKey, newSession);
    return newSession;
  });

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
          slug: data.tour.slug || String(tourId),
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


  // Check availability when selection changes (debounced to improve responsiveness / INP)
  useEffect(() => {
    if (!tour || !selectedDate || !selectedTime || (adults + children) === 0) {
      setAvailabilityError('');
      setAvailabilityLoading(false);
      return;
    }

    // Clear previous error immediately on any selection change for better responsiveness
    setAvailabilityError('');

    const delay = 350; // ms
    const timer = setTimeout(() => {
      checkSeatAvailability();
    }, delay);

    return () => clearTimeout(timer);
  }, [selectedDate, selectedTime, adults, children]);




  // Create soft hold for seats (30 minutes)
  const createSeatHold = async (): Promise<boolean> => {
    if (!tour || !selectedDate || !selectedTime) return false;

    setHoldLoading(true);
    try {
      const response = await fetch(`${API_PREFIX}/create-hold`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tour_id: tour.id,
          date: selectedDate,
          time: selectedTime,
          seats: adults + children,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reserve seats');
      }

      const data = await response.json();
      setHoldExpiration(new Date(data.expires_at));
      console.log('✅ Seat hold created:', data);
      return true;

    } catch (error) {
      console.error('❌ Failed to create seat hold:', error);
      alert(`Failed to reserve seats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setHoldLoading(false);
    }
  };

  const getAvailableTimesForDate = (date: string) => {
    return timeSlots.filter(slot => slot.date === date);
  };

  // Check seat availability for current selection
  const checkSeatAvailability = async () => {
    if (!tour || !selectedDate || !selectedTime || (adults + children) === 0) {
      setAvailabilityError('');
      return;
    }

    setAvailabilityLoading(true);
    setAvailabilityError('');

    try {
      const requestedPeople = adults + children;
      const response = await fetch(
        `${API_PREFIX}/check-availability?tour_id=${tour.id}&date=${selectedDate}&time=${selectedTime}&requested_people=${requestedPeople}`
      );

      if (!response.ok) {
        throw new Error('Failed to check availability');
      }

      const data = await response.json();

      if (!data.can_book) {
        setAvailabilityError(data.message || 'Insufficient seats available');
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityError('Unable to check seat availability');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setAvailabilityError(''); // Clear any previous availability errors
    
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

  const getLanguageDisplay = (code?: string) => {
    if (!code) return 'English';
    const map: { [key: string]: string } = {
      en: 'English',
      ar: 'Arabic'
    };
    return map[code.toLowerCase()] || code;
  };

  // Common validation function
  const validateSelection = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select a date and time slot first.');
      return false;
    }

    if (adults === 0) {
      alert('Please add at least 1 adult.');
      return false;
    }

    if (availabilityError) {
      alert('Cannot proceed: ' + availabilityError);
      return false;
    }

    return true;
  };

  // Book Now: Create hold + Add to cart + Go to checkout
  const handleBookNow = async () => {
    if (!validateSelection()) return;

    // Create soft hold
    const holdCreated = await createSeatHold();
    if (!holdCreated) return;

    // Make sure we have the expiration time
    const expirationTime = holdExpiration || new Date(Date.now() + 30 * 60 * 1000);

    // Add to cart with tour data for notification
    const tourData = {
      id: tour?.id || Number(tourId),
      title: tour?.title || 'Tour',
      price_per_person: tour?.price_per_person || 0,
      image_urls: []
    };

    addBookedTour({
      tourId: tour?.id || Number(tourId),
      tourSlug: tour?.slug || String(tourId),
      tourTitle: tour?.title || 'Tour',
      date: selectedDate,
      time: selectedTime,
      adults,
      children,
      totalAmount: calculateTotal(),
      pricePerPerson: tour?.price_per_person || 0,
      sessionId: sessionId,
      holdExpiresAt: expirationTime.toISOString(),
      language: getLanguageDisplay(timeSlots.find(s => s.date === selectedDate && s.time === selectedTime)?.language)
    }, tourData);

    // Store booking data for checkout
    const bookingInfo = {
      tour_id: tour?.id || tourId,
      date: selectedDate,
      time: selectedTime,
      language: getLanguageDisplay(timeSlots.find(s => s.date === selectedDate && s.time === selectedTime)?.language),
      adults,
      children,
      total_amount: calculateTotal(),
      price_per_person: tour?.price_per_person || 0,
      session_id: sessionId,
      hold_expires_at: expirationTime.toISOString()
    };

    localStorage.setItem('bookingData', JSON.stringify(bookingInfo));
    console.log('📦 Booking data stored with hold expiration:', expirationTime.toISOString());

    // Go to checkout
    onCheckout(bookingInfo);
  };

  // Add to Cart: Create hold + Add to cart + Stay on page
  const handleAddToCart = async () => {
    if (!validateSelection()) return;

    // Create soft hold
    const holdCreated = await createSeatHold();
    if (!holdCreated) return;

    // Make sure we have the expiration time
    const expirationTime = holdExpiration || new Date(Date.now() + 30 * 60 * 1000);

    // Add to cart with tour data for notification
    const tourData = {
      id: tour?.id || Number(tourId),
      title: tour?.title || 'Tour',
      price_per_person: tour?.price_per_person || 0,
      image_urls: []
    };

    addBookedTour({
      tourId: tour?.id || Number(tourId),
      tourSlug: tour?.slug || String(tourId),
      tourTitle: tour?.title || 'Tour',
      date: selectedDate,
      time: selectedTime,
      adults,
      children,
      totalAmount: calculateTotal(),
      pricePerPerson: tour?.price_per_person || 0,
      sessionId: sessionId,
      holdExpiresAt: expirationTime.toISOString(),
      language: getLanguageDisplay(timeSlots.find(s => s.date === selectedDate && s.time === selectedTime)?.language)
    }, tourData);

    // Store booking data even for cart (in case user navigates to checkout later)
    const bookingInfo = {
      tour_id: tour?.id || tourId,
      date: selectedDate,
      time: selectedTime,
      language: getLanguageDisplay(timeSlots.find(s => s.date === selectedDate && s.time === selectedTime)?.language),
      adults,
      children,
      total_amount: calculateTotal(),
      price_per_person: tour?.price_per_person || 0,
      session_id: sessionId,
      hold_expires_at: expirationTime.toISOString()
    };

    localStorage.setItem('bookingData', JSON.stringify(bookingInfo));
    console.log('📦 Booking data stored with hold expiration:', expirationTime.toISOString());

    // Stay on current page - user can continue browsing or go to cart
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
              onTimeSelect={(time) => {
                setSelectedTime(time);
                setAvailabilityError(''); // Clear any previous availability errors
              }}
            />

            {/* Availability Display */}
            {selectedDate && selectedTime && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-blue-900">Seat Availability</span>
                  {availabilityLoading && (
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  )}
                </div>
                {(() => {
                  const slot = timeSlots.find(s => s.date === selectedDate && s.time === selectedTime);
                  return slot && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Available seats:</span>
                      <span className={`font-medium ${slot.available_spots && slot.available_spots > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {slot.available_spots || 0} / {slot.capacity || 0}
                      </span>
                    </div>
                  );
                })()}
                {availabilityError && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                    ⚠️ {availabilityError}
                  </div>
                )}
              </div>
            )}

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

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Book Now Button */}
              <Button
                size="lg"
                onClick={handleBookNow}
                disabled={!selectedDate || !selectedTime || adults === 0 || !!availabilityError || availabilityLoading || holdLoading}
                className="w-full bg-gradient-to-r from-primary to-teal-600 hover:from-teal-700 hover:to-teal-700 shadow-lg text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {holdLoading ? 'Reserving Seats...' :
                 availabilityLoading ? 'Checking Availability...' : 
                 availabilityError ? 'Insufficient Seats' : 
                 'Book Now'}
              </Button>

              {/* Add to Cart Button */}
              <Button
                size="lg"
                variant="outline"
                onClick={handleAddToCart}
                disabled={!selectedDate || !selectedTime || adults === 0 || !!availabilityError || availabilityLoading || holdLoading}
                className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white shadow-md text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {holdLoading ? 'Reserving Seats...' :
                 availabilityLoading ? 'Checking Availability...' : 
                 availabilityError ? 'Insufficient Seats' : 
                 'Add to Cart'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}