import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
}

export default function TicketsQuantity() {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();

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

  const [sessionId] = useState<string>(() => {
    const storageKey = `buddy_tour_session_${tourId}`;
    const existingSession = localStorage.getItem(storageKey);
    if (existingSession) return existingSession;
    const newSession = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(storageKey, newSession);
    return newSession;
  });

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
        if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to load tour`);
        const data = await response.json();

        if (!data.tour) throw new Error('Tour not found');

        let pricePerPerson = data.tour.price_per_person;
        if (typeof pricePerPerson === 'string')
          pricePerPerson = parseFloat(pricePerPerson.replace('$', ''));

        const tourData: Tour = {
          id: data.tour.id,
          title: data.tour.title,
          price_per_person: pricePerPerson,
          max_group_size: data.tour.max_group_size || 12,
        };

        setTour(tourData);

        const slots = (data.time_slots || []).map((slot: any) => ({
          ...slot,
          date: extractDateFromISO(slot.date),
        }));

        setTimeSlots(slots);
      } catch (error: any) {
        setError(error.message || 'Failed to load tour data');
      } finally {
        setLoading(false);
      }
    };

    loadTourData();
  }, [tourId]);

  useEffect(() => {
    checkSeatAvailability();
  }, [selectedDate, selectedTime, adults, children]);

  const createSeatHold = async (): Promise<boolean> => {
    if (!tour || !selectedDate || !selectedTime) return false;
    setHoldLoading(true);
    try {
      const response = await fetch(`${API_PREFIX}/create-hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tour_id: tour.id,
          date: selectedDate,
          time: selectedTime,
          seats: adults + children,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reserve seats');
      }

      const data = await response.json();
      setHoldExpiration(new Date(data.expires_at));
      return true;
    } catch (error) {
      console.error('Failed to create seat hold:', error);
      alert('Failed to reserve seats.');
      return false;
    } finally {
      setHoldLoading(false);
    }
  };

  const checkSeatAvailability = async () => {
    if (!tour || !selectedDate || !selectedTime || (adults + children) === 0) {
      setAvailabilityError('');
      return;
    }

    setAvailabilityLoading(true);
    try {
      const response = await fetch(
        `${API_PREFIX}/check-availability?tour_id=${tour.id}&date=${selectedDate}&time=${selectedTime}&requested_people=${adults + children}`
      );

      const data = await response.json();
      if (!data.can_book) {
        setAvailabilityError(data.message || 'Insufficient seats available');
      } else {
        setAvailabilityError('');
      }
    } catch {
      setAvailabilityError('Unable to check seat availability');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleBookNow = async () => {
    if (!tour) return;
    const holdCreated = await createSeatHold();
    if (!holdCreated) return;

    const expirationTime = holdExpiration || new Date(Date.now() + 30 * 60 * 1000);
    const bookingInfo = {
      tour_id: tour.id,
      date: selectedDate,
      time: selectedTime,
      adults,
      children,
      total_amount: calculateTotal(),
      price_per_person: tour.price_per_person,
      session_id: sessionId,
      hold_expires_at: expirationTime.toISOString(),
    };

    localStorage.setItem('bookingData', JSON.stringify(bookingInfo));
    navigate('/checkout');
  };

  const handleAddToCart = async () => {
    if (!tour) return;
    const holdCreated = await createSeatHold();
    if (!holdCreated) return;

    const expirationTime = holdExpiration || new Date(Date.now() + 30 * 60 * 1000);
    addBookedTour(
      {
        tourId: tour.id,
        tourTitle: tour.title,
        date: selectedDate,
        time: selectedTime,
        adults,
        children,
        totalAmount: calculateTotal(),
        pricePerPerson: tour.price_per_person,
        sessionId: sessionId,
        holdExpiresAt: expirationTime.toISOString(),
      },
      tour
    );
  };

  const calculateTotal = (): number => {
    if (!tour) return 0;
    const childPrice = tour.price_per_person * 0.8;
    return adults * tour.price_per_person + children * childPrice;
  };

  if (loading) return <p>Loading...</p>;
  if (error || !tour) return <p>{error || 'Error loading tour'}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-amber-50/20 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{tour.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge>Price: {formatPrice(tour.price_per_person)}</Badge>
            <TicketCounter
              tour={tour}
              adults={adults}
              children={children}
              onChangeCount={(type, delta) =>
                type === 'adults'
                  ? setAdults(Math.max(0, adults + delta))
                  : setChildren(Math.max(0, children + delta))
              }
            />
            <PriceDisplay tour={tour} adults={adults} children={children} />
            <Button onClick={handleBookNow} disabled={holdLoading}>
              <ShoppingCart className="h-5 w-5 mr-2" /> Book Now
            </Button>
            <Button variant="outline" onClick={handleAddToCart} disabled={holdLoading}>
              Add to Cart
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
