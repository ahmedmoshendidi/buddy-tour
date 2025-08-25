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

interface FavoritesContextType {
  favorites: Tour[];
  addToFavorites: (tour: Tour) => void;
  removeFromFavorites: (tourId: number) => void;
  isFavorite: (tourId: number) => boolean;
  clearFavorites: () => void;
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
  const [notificationTour, setNotificationTour] = useState<Tour | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('buddytour_favorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Failed to load favorites from localStorage:', error);
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

  const value: FavoritesContextType = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    clearFavorites,
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