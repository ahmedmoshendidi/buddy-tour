import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Tour {
  id: number;
  title: string;
  description: string;
  duration: string;
  max_group_size: number;
  price_per_person: number;
  image_urls: string[];
  rating?: number;
  reviews_count?: number;
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
}

interface FavoritesContextType {
  favorites: Tour[];
  addToFavorites: (tour: Tour) => void;
  removeFromFavorites: (tourId: number) => void;
  isFavorite: (tourId: number) => boolean;
  clearFavorites: () => void;
  // Booked tours (cart with holds)
  bookedTours: BookedTour[];
  addBookedTour: (tour: Omit<BookedTour, 'id' | 'createdAt'>) => void;
  removeBookedTour: (tourId: string) => void;
  clearBookedTours: () => void;
  getCartTotal: () => number;
  // Notification states
  notificationTour: Tour | null;
  showNotification: boolean;
  hideNotification: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<Tour[]>([]);
  const [bookedTours, setBookedTours] = useState<BookedTour[]>([]);
  const [notificationTour, setNotificationTour] = useState<Tour | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Load favorites and booked tours from localStorage on mount
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('buddytour_favorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }

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
      console.error('Failed to load data from localStorage:', error);
    }
  }, []);

  // Save favorites to localStorage whenever favorites change
  useEffect(() => {
    try {
      localStorage.setItem('buddytour_favorites', JSON.stringify(favorites));
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error);
    }
  }, [favorites]);

  // Save booked tours to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('buddytour_booked_tours', JSON.stringify(bookedTours));
    } catch (error) {
      console.error('Failed to save booked tours to localStorage:', error);
    }
  }, [bookedTours]);

  const addToFavorites = (tour: Tour) => {
    setFavorites(prev => {
      // Check if tour is already in favorites
      if (prev.some(fav => fav.id === tour.id)) {
        return prev;
      }
      
      // Show notification for new addition
      setNotificationTour(tour);
      setShowNotification(true);
      
      return [...prev, tour];
    });
  };

  const removeFromFavorites = (tourId: number) => {
    setFavorites(prev => prev.filter(fav => fav.id !== tourId));
  };

  const isFavorite = (tourId: number) => {
    return favorites.some(fav => fav.id === tourId);
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  const hideNotification = () => {
    setShowNotification(false);
    // Clear the tour after animation completes
    setTimeout(() => {
      setNotificationTour(null);
    }, 300);
  };

  // Booked tours functions
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

  const value: FavoritesContextType = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    clearFavorites,
    bookedTours,
    addBookedTour,
    removeBookedTour,
    clearBookedTours,
    getCartTotal,
    notificationTour,
    showNotification,
    hideNotification
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};