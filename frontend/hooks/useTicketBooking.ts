import { useState, useEffect } from 'react';
import { API_PREFIX } from '../config';

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

export function useTicketBooking(tourId: string | number) {
  const [loading, setLoading] = useState(true);
  const [tour, setTour] = useState<Tour | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [error, setError] = useState<string>('');

  // Helper function to extract date from ISO string
  const extractDateFromISO = (isoString: string): string => {
    try {
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
        
        // Process time slots to normalize date format
        const slots = (data.time_slots || []).map((slot: any) => ({
          ...slot,
          date: extractDateFromISO(slot.date)
        }));
        
        setTimeSlots(slots);
        
        // Auto-select today if available, otherwise select first available date
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const todaySlots = slots.filter((slot: TimeSlot) => slot.date === todayStr);
        
        if (todaySlots.length > 0) {
          setSelectedDate(todayStr);
          setSelectedTime(todaySlots[0].time);
        } else if (slots.length > 0) {
          const firstDate = slots[0].date;
          const firstDateSlots = slots.filter((slot: TimeSlot) => slot.date === firstDate);
          setSelectedDate(firstDate);
          setSelectedTime(firstDateSlots[0]?.time || '');
        } else {
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

  const updateTicketCount = (type: 'adults' | 'children', operation: 'add' | 'subtract') => {
    if (type === 'adults') {
      setAdults(prev => {
        const newCount = operation === 'add' ? prev + 1 : Math.max(1, prev - 1);
        return Math.min(newCount, tour?.max_group_size || 12);
      });
    } else {
      setChildren(prev => {
        const newCount = operation === 'add' ? prev + 1 : Math.max(0, prev - 1);
        const maxChildren = Math.max(0, (tour?.max_group_size || 12) - adults);
        return Math.min(newCount, maxChildren);
      });
    }
  };

  const totalPeople = adults + children;
  const totalPrice = tour ? (adults * tour.price_per_person) + (children * tour.price_per_person * 0.8) : 0;

  const canProceedToCheckout = () => {
    // Must have tour, selected date/time, at least 1 adult, and valid time slots
    return tour && selectedDate && selectedTime && adults > 0 && timeSlots.length > 0 &&
           timeSlots.some(slot => slot.date === selectedDate && slot.time === selectedTime);
  };

  const proceedToCheckout = () => {
    if (!canProceedToCheckout()) return;

    const bookingData = {
      tour_id: tour!.id,
      date: selectedDate,
      time: selectedTime,
      adults,
      children,
      total_amount: totalPrice,
      price_per_person: tour!.price_per_person
    };

    localStorage.setItem('bookingData', JSON.stringify(bookingData));
  };

  return {
    // State
    loading,
    tour,
    timeSlots,
    selectedDate,
    selectedTime,
    adults,
    children,
    error,
    totalPeople,
    totalPrice,

    // Actions
    setSelectedDate,
    setSelectedTime,
    updateTicketCount,
    canProceedToCheckout,
    proceedToCheckout
  };
}