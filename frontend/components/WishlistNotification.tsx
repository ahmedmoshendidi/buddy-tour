import React, { useEffect, useState } from 'react';
import { Heart, ShoppingCart, X } from 'lucide-react';
import { useCurrency } from './CurrencyContext';

interface Tour {
  id: number;
  title: string;
  price_per_person: number;
  image_urls?: string[];
}

interface WishlistNotificationProps {
  tour: Tour | null;
  isVisible: boolean;
  onClose: () => void;
}

export default function WishlistNotification({ tour, isVisible, onClose }: WishlistNotificationProps) {
  const { formatPrice } = useCurrency();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      // Delay removing from DOM to allow exit animation
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!shouldRender || !tour) return null;

  return (
    <div className={`
      fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out transform
      ${isVisible 
        ? 'translate-x-0 opacity-100 scale-100' 
        : 'translate-x-full opacity-0 scale-95'
      }
    `}>
      <div className="bg-white border border-border rounded-lg shadow-lg p-4 max-w-sm w-full">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0 relative">
            <div className="w-8 h-8 bg-coral-50 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-coral-600" />
              <Heart className="h-2.5 w-2.5 text-coral-600 absolute top-1.5 left-1.5 fill-current" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Added to wishlist!</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                  {tour.title}
                </p>
                <p className="text-xs font-medium text-primary mt-1">
                  {formatPrice(tour.price_per_person)}
                </p>
              </div>
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 w-full bg-muted rounded-full h-1 overflow-hidden">
          <div 
            className="h-full bg-coral-500 rounded-full transition-all duration-4000 ease-linear"
            style={{
              width: isVisible ? '0%' : '100%',
              transition: isVisible ? 'width 4000ms linear' : 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
}