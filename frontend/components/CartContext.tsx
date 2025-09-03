import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
}

interface CartContextType {
  bookedTours: BookedTour[];
  addBookedTour: (tour: Omit<BookedTour, 'id' | 'createdAt'>) => void;
  removeBookedTour: (tourId: string) => void;
  clearBookedTours: () => void;
  getCartTotal: () => number;
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

  // Load booked tours from localStorage on mount
  useEffect(() => {
    try {
      const savedBookedTours = localStorage.getItem('buddytour_booked_tours');
      if (savedBookedTours) {
        const parsed = JSON.parse(savedBookedTours);
        // Filter out expired tours
        const validTours = parsed.filter((tour: BookedTour) => 
          new Date(tour.holdExpiresAt) > new Date()
        );
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

  const addBookedTour = (tour: Omit<BookedTour, 'id' | 'createdAt'>) => {
    const newBookedTour: BookedTour = {
      ...tour,
      id: `booked_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    
    setBookedTours(prev => [...prev, newBookedTour]);
    console.log('✅ Added to cart:', newBookedTour);
  };

  const removeBookedTour = (tourId: string) => {
    setBookedTours(prev => prev.filter(tour => tour.id !== tourId));
    console.log('🗑️ Removed from cart:', tourId);
  };

  const clearBookedTours = () => {
    setBookedTours([]);
    console.log('🧹 Cart cleared');
  };

  const getCartTotal = () => {
    return bookedTours.reduce((total, tour) => total + tour.totalAmount, 0);
  };

  const value: CartContextType = {
    bookedTours,
    addBookedTour,
    removeBookedTour,
    clearBookedTours,
    getCartTotal
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};