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
  addBookedTour: (tour: Omit<BookedTour, 'id' | 'createdAt'>, tourData?: Tour) => void;
  removeBookedTour: (tourId: string) => void;
  clearBookedTours: () => void;
  getCartTotal: () => number;

  // Session-based operations
  removeBookedTourBySession: (sessionId: string) => void;
  markTourAsPaid: (sessionId: string) => void;

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
  const [bookedTours, setBookedTours] = useState<BookedTour[]>([]);
  const [notificationTour, setNotificationTour] = useState<Tour | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Load booked tours from localStorage on mount
  useEffect(() => {
    try {
      const savedBookedTours = localStorage.getItem('buddytour_booked_tours');
      if (savedBookedTours) {
        const parsed = JSON.parse(savedBookedTours);
        
        // Check for paid bookings
        const paidBookingRaw = localStorage.getItem('paid_booking');
        const paidBooking = paidBookingRaw ? JSON.parse(paidBookingRaw) : null;
        
        // Filter out expired tours and mark paid ones
        const validTours = parsed.filter((tour: BookedTour) => 
          new Date(tour.holdExpiresAt) > new Date()
        ).map((tour: BookedTour) => ({
          ...tour,
          isPaid: paidBooking?.session_id === tour.sessionId
        }));
        
        console.log('📦 CartContext: Loaded', validTours.length, 'tours,', validTours.filter(t => t.isPaid).length, 'paid');
        
        setBookedTours(validTours);
        
        // Update localStorage if we removed expired tours
        if (validTours.length !== parsed.length) {
          localStorage.setItem('buddytour_booked_tours', JSON.stringify(validTours));
        }
      }
    } catch (error) {
      console.error('Failed to load booked tours from localStorage:', error);
    }
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

  const removeBookedTourBySession = (sessionId: string) => {
    setBookedTours(prev => {
      const before = prev.length;
      const filtered = prev.filter(t => t.sessionId !== sessionId);
      const after = filtered.length;
      console.log('🗑️ Removed from cart by sessionId:', sessionId, `(${before} -> ${after} tours)`);
      return filtered;
    });
  };

  const markTourAsPaid = (sessionId: string) => {
    setBookedTours(prev => {
      const updated = prev.map(tour => 
        tour.sessionId === sessionId 
          ? { ...tour, isPaid: true }
          : tour
      );
      const paidCount = updated.filter(t => t.isPaid).length;
      console.log('💳 Marked as paid by sessionId:', sessionId, '- Total paid tours:', paidCount);
      return updated;
    });
  };


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

  const value: CartContextType = {
    bookedTours,
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