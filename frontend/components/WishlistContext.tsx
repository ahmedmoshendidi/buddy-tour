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

interface WishlistContextType {
  wishlist: Tour[];
  addToWishlist: (tour: Tour) => void;
  removeFromWishlist: (tourId: number) => void;
  isInWishlist: (tourId: number) => boolean;
  clearWishlist: () => void;
  // Notification states
  notificationTour: Tour | null;
  showNotification: boolean;
  hideNotification: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Tour[]>([]);
  const [notificationTour, setNotificationTour] = useState<Tour | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem('buddytour_wishlist');
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
    } catch (error) {
      console.error('Failed to load wishlist from localStorage:', error);
    }
  }, []);

  // Save wishlist to localStorage whenever wishlist changes
  useEffect(() => {
    try {
      localStorage.setItem('buddytour_wishlist', JSON.stringify(wishlist));
    } catch (error) {
      console.error('Failed to save wishlist to localStorage:', error);
    }
  }, [wishlist]);

  const addToWishlist = (tour: Tour) => {
    setWishlist(prev => {
      // Check if tour is already in wishlist
      if (prev.some(item => item.id === tour.id)) {
        return prev;
      }
      
      // Show notification for new addition
      setNotificationTour(tour);
      setShowNotification(true);
      
      return [...prev, tour];
    });
  };

  const removeFromWishlist = (tourId: number) => {
    setWishlist(prev => prev.filter(item => item.id !== tourId));
  };

  const isInWishlist = (tourId: number) => {
    return wishlist.some(item => item.id === tourId);
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  const hideNotification = () => {
    setShowNotification(false);
    // Clear the tour after animation completes
    setTimeout(() => {
      setNotificationTour(null);
    }, 300);
  };

  const value: WishlistContextType = {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    notificationTour,
    showNotification,
    hideNotification
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};