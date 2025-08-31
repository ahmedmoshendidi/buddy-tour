import { useState, useEffect } from 'react';
import { API_PREFIX } from '../config';
import type { Tour } from './useTourDetails';

export function useTours() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadTours = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await fetch(`${API_PREFIX}/tours`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.tours || !Array.isArray(data.tours)) {
          throw new Error('Invalid tours data received from server');
        }
        
        // Process tours data to ensure consistent format
        const processedTours = data.tours.map((tour: any) => {
          // Extract numeric price for currency conversion
          let numericPrice = tour.price_per_person;
          if (typeof numericPrice === 'string') {
            numericPrice = parseFloat(numericPrice.replace('$', ''));
          }
          
          return {
            ...tour,
            price_per_person: numericPrice, // Store as number for conversion
            // Add default values for fields that might not be in database
            duration: tour.duration || '2 hours',
            rating: tour.rating || 4.8,
            reviews_count: tour.reviews_count || 100,
            image_urls: tour.image_urls || ['https://images.unsplash.com/photo-1539650116574-75c0c6d2d167?w=400&h=250&fit=crop']
          };
        });
        
        setTours(processedTours);
        
      } catch (error: any) {
        console.error('Error loading tours:', error);
        setError(error.message || 'Failed to load tours');
      } finally {
        setLoading(false);
      }
    };

    loadTours();
  }, []);

  return { tours, loading, error };
}