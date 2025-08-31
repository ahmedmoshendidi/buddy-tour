import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Calendar as CalendarIcon, Clock, Users, Plus, Minus, ShoppingCart } from 'lucide-react';
import { API_PREFIX } from '../config';
import { useCurrency } from './CurrencyContext';

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
  tourId: number;
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
        const response = await fetch(`${API_PREFIX}/tours/${tourId}`);
        
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
        
        // Process time slots to normalize date format
        const slots = (data.time_slots || []).map((slot: any) => ({
          ...slot,
          date: extractDateFromISO(slot.date) // Convert ISO to YYYY-MM-DD
        }));
        
        setTimeSlots(slots);
        
        // Auto-select today if available, otherwise select first available date
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const todaySlots = slots.filter((slot: TimeSlot) => slot.date === todayStr);
        
        if (todaySlots.length > 0) {
          setSelectedDate(todayStr);
          // Auto-select first available time for today
          setSelectedTime(todaySlots[0].time);
        } else if (slots.length > 0) {
          // Select first available date and time slot
          const firstDate = slots[0].date;
          const firstDateSlots = slots.filter((slot: TimeSlot) => slot.date === firstDate);
          setSelectedDate(firstDate);
          setSelectedTime(firstDateSlots[0]?.time || '');
        } else {
          // Default to today even if no slots
          setSelectedDate(todayStr);
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

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const days: React.ReactNode[] = [];

    // Empty cells for days before the month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const isToday = todayStr === dateStr;
      const isPast = dateStr < todayStr;
      const isSelected = selectedDate === dateStr;
      // Now this comparison will work properly since both sides are in YYYY-MM-DD format
      const hasSlots = timeSlots.some(slot => slot.date === dateStr);

      const handleDateClick = (selectedDateStr: string) => {
        if (isPast) return;
        
        setSelectedDate(selectedDateStr);
        
        // Clear selected time when changing dates
        setSelectedTime('');
        
        // Auto-select first available time if the new date has slots
        const availableTimesForDate = timeSlots.filter(slot => slot.date === selectedDateStr);
        if (availableTimesForDate.length > 0) {
          setSelectedTime(availableTimesForDate[0].time);
        }
      };

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(dateStr)}
          disabled={isPast}
          className={`
            p-2 m-1 rounded-md font-medium transition-all duration-200 min-h-[40px] min-w-[40px] relative
            ${isPast 
              ? 'text-muted-foreground cursor-not-allowed bg-muted/30' 
              : 'hover:bg-primary/10 cursor-pointer'
            }
            ${isSelected 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'text-foreground'
            }
            ${isToday && !isSelected 
              ? 'ring-2 ring-primary ring-offset-2' 
              : ''
            }
            ${!hasSlots && !isPast && !isSelected
              ? 'text-muted-foreground bg-muted/20'
              : ''
            }
          `}
        >
          {day}
          {/* Show indicator for dates with available slots */}
          {hasSlots && !isSelected && !isPast && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"></div>
          )}
        </button>
      );
    }

    return days;
  };

  const getAvailableTimesForDate = (date: string) => {
    return timeSlots.filter(slot => slot.date === date);
  };

  const changeCount = (type: 'adults' | 'children', delta: number) => {
    if (type === 'adults') {
      setAdults(Math.max(0, adults + delta));
    } else {
      setChildren(Math.max(0, children + delta));
    }
  };

  const calculateTotal = (): number => {
    if (!tour) return 0;
    const childPrice = tour.price_per_person * 0.8; // 20% discount for children
    return (adults * tour.price_per_person) + (children * childPrice);
  };

  const handleCheckout = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select a date and time slot first.');
      return;
    }

    if (adults === 0 && children === 0) {
      alert('Please select at least one ticket.');
      return;
    }

    const bookingInfo = {
      tour_id: tourId,
      date: selectedDate,
      time: selectedTime,
      adults,
      children,
      total_amount: calculateTotal(),
      price_per_person: tour?.price_per_person || 0
    };

    // Store in sessionStorage for checkout process
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('bookingInfo', JSON.stringify(bookingInfo));
    }

    onCheckout();
  };

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

            {/* Calendar */}
            <div>
              <h3 className="text-lg mb-4 text-primary flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Choose a Tour Date
              </h3>
              
              <div className="bg-gradient-to-br from-teal-50 to-amber-50 p-6 rounded-lg border">
                <div className="text-center mb-4">
                  <div className="flex items-center justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                    >
                      ‹
                    </Button>
                    <h4 className="font-semibold">
                      {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                    </h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                    >
                      ›
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="p-2">{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {generateCalendar()}
                </div>
                
                {/* Legend */}
                <div className="mt-4 flex justify-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-primary rounded mr-2"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 border-2 border-primary rounded mr-2"></div>
                    <span>Today</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-muted/60 rounded mr-2 relative">
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
                    </div>
                    <span>Has times available</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <h3 className="text-lg mb-4 text-primary flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Select Time Slot
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableTimes.length > 0 ? (
                  availableTimes.map((slot, index) => (
                    <Button
                      key={`${slot.date}-${slot.time}-${index}`}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`
                        ${selectedTime === slot.time 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-primary/10'
                        }
                      `}
                    >
                      {slot.time.slice(0, 5)}
                    </Button>
                  ))
                ) : (
                  <div className="col-span-full text-center py-6">
                    {selectedDate ? (
                      <div className="space-y-2">
                        <p className="text-muted-foreground">No available times for this date.</p>
                        <p className="text-sm text-muted-foreground">Please select a different date or check back later.</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Please select a date first.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Selection */}
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
                      onClick={() => changeCount('adults', -1)}
                      disabled={adults === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{adults}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => changeCount('adults', 1)}
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
                      onClick={() => changeCount('children', -1)}
                      disabled={children === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{children}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => changeCount('children', 1)}
                      disabled={adults + children >= (tour.max_group_size || 12)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Price */}
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

            {/* Checkout Button */}
            <Button
              size="lg"
              onClick={handleCheckout}
              disabled={!selectedDate || !selectedTime || (adults === 0 && children === 0)}
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