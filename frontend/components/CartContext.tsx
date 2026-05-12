import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Tour {
  id: number;
  title: string;
  price_per_person: number;
  image_urls?: string[];
}

interface BookedTour {
  id: string; // Unique cart item ID
  tourId: number;
  tourSlug: string; // Added for navigation
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
  isPaid?: boolean; // Track paid status
  orderId?: string; // Track order ID (BT-...)
  language?: string; // Add language property
}

// interface CartContextType {
//   bookedTours: BookedTour[];
//   addBookedTour: (tour: Omit<BookedTour, 'id' | 'createdAt'>, tourData?: Tour) => void;
//   removeBookedTour: (tourId: string) => void;
//   clearBookedTours: () => void;
//   getCartTotal: () => number;
//   // Notification states
//   notificationTour: Tour | null;
//   showNotification: boolean;
//   hideNotification: () => void;
// }

interface CartContextType {
  bookedTours: BookedTour[];
  unpaidTours: BookedTour[];
  paidTours: BookedTour[];
  addBookedTour: (tour: Omit<BookedTour, 'id' | 'createdAt'>, tourData?: Tour) => void;
  removeBookedTour: (tourId: string) => void;
  clearBookedTours: () => void;
  getCartTotal: () => number;

  // Session-based operations
  removeBookedTourBySession: (sessionId: string) => void;
  markTourAsPaid: (sessionId: string, orderId?: string) => void;

  // Notification states
  notificationTour: Tour | null;
  showNotification: boolean;
  hideNotification: () => void;
}


const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [bookedTours, setBookedTours] = useState<BookedTour[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const savedBookedTours = localStorage.getItem('buddytour_booked_tours');
      if (!savedBookedTours) return [];
      
      const parsed = JSON.parse(savedBookedTours);
      const paidBookingRaw = localStorage.getItem('paid_booking');
      const paidBooking = paidBookingRaw ? JSON.parse(paidBookingRaw) : null;

      // Filter out expired tours but ALWAYS keep paid ones
      return parsed.filter((tour: BookedTour) => {
        const isActuallyPaid = tour.isPaid || (paidBooking?.session_id === tour.sessionId);
        const isNotExpired = new Date(tour.holdExpiresAt) > new Date();
        return isActuallyPaid || isNotExpired;
      }).map((tour: BookedTour) => ({
        ...tour,
        isPaid: tour.isPaid || (paidBooking?.session_id === tour.sessionId),
        orderId: tour.orderId || (paidBooking?.session_id === tour.sessionId ? paidBooking.order_id : undefined)
      }));
    } catch (e) {
      console.error('Error initializing CartContext:', e);
      return [];
    }
  });
  
  const [notificationTour, setNotificationTour] = useState<Tour | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Sync back to localStorage if we filtered during initialization
  useEffect(() => {
    localStorage.setItem('buddytour_booked_tours', JSON.stringify(bookedTours));
  }, []);

  // Save booked tours to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('buddytour_booked_tours', JSON.stringify(bookedTours));
    } catch (error) {
      console.error('Failed to save booked tours to localStorage:', error);
    }
  }, [bookedTours]);

  const addBookedTour = (tour: Omit<BookedTour, 'id' | 'createdAt'>, tourData?: Tour) => {
    const newBookedTour: BookedTour = {
      ...tour,
      id: `booked_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    setBookedTours(prev => [...prev, newBookedTour]);
    console.log('✅ Added to cart:', newBookedTour);

    // Meta Pixel AddToCart Event
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'AddToCart', {
        content_name: tourData?.title || tour.tourTitle,
        content_ids: [tour.tourId],
        content_type: 'product',
        value: tour.totalAmount,
        currency: 'USD'
      });
    }

    // Show notification if tour data is provided
    if (tourData) {
      setNotificationTour(tourData);
      setShowNotification(true);
    }
  };

  const removeBookedTour = (tourId: string) => {
    setBookedTours(prev => prev.filter(tour => tour.id !== tourId));
    console.log('🗑️ Removed from cart:', tourId);
  };

  const removeBookedTourBySession = React.useCallback((sessionId: string) => {
    setBookedTours(prev => {
      const before = prev.length;
      const filtered = prev.filter(t => t.sessionId !== sessionId);
      const after = filtered.length;
      console.log('🗑️ CartContext: Removed by sessionId:', sessionId, `(${before} -> ${after} tours)`);
      return filtered;
    });
  }, []);

  const markTourAsPaid = React.useCallback((sessionId: string, orderId?: string) => {
    setBookedTours(prev => {
      const updated = prev.map(tour =>
        tour.sessionId === sessionId
          ? { ...tour, isPaid: true, orderId: orderId || tour.orderId }
          : tour
      );
      const found = updated.some(t => t.sessionId === sessionId && t.isPaid);
      console.log(`💳 CartContext: markTourAsPaid for ${sessionId}. Success: ${found}. OrderId: ${orderId}`);
      return updated;
    });
  }, []);


  const clearBookedTours = () => {
    setBookedTours([]);
    console.log('🧹 Cart cleared');
  };

  const getCartTotal = () => {
    return bookedTours.reduce((total, tour) => total + tour.totalAmount, 0);
  };

  const hideNotification = () => {
    setShowNotification(false);
    // Clear the tour after animation completes
    setTimeout(() => {
      setNotificationTour(null);
    }, 300);
  };

  const unpaidTours = bookedTours.filter(t => !t.isPaid);
  const paidTours = bookedTours.filter(t => t.isPaid);

  const value: CartContextType = {
    bookedTours,
    unpaidTours,
    paidTours,
    addBookedTour,
    removeBookedTour,
    clearBookedTours,
    getCartTotal,
    removeBookedTourBySession,
    markTourAsPaid,
    notificationTour,
    showNotification,
    hideNotification
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};