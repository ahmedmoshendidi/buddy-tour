import React, { useEffect, useState } from 'react';
import { CheckCircle, ShoppingCart, X } from 'lucide-react';
import { useCurrency } from './CurrencyContext';

interface Tour {
  id: number;
  title: string;
  price_per_person: number;
  image_urls?: string[];
}

interface CartNotificationProps {
  tour: Tour | null;
  isVisible: boolean;
  onClose: () => void;
}

export default function CartNotification({ tour, isVisible, onClose }: CartNotificationProps) {
  const { formatPrice } = useCurrency();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!shouldRender || !tour) return null;

  return (
    <div 
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm w-full">
        <div className="flex items-start gap-3">
          {/* Success Icon */}
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Added to cart!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your seats are reserved for 30 minutes
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <ShoppingCart className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium text-primary truncate">
                {tour.title}
              </span>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-semibold text-green-600">
                {formatPrice(tour.price_per_person)}/person
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}