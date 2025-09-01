import { useState, useEffect } from 'react';
import { API_PREFIX } from '../config';

export interface Tour {
  id: number;
  slug?: string;
  title: string;
  description: string;
  duration?: string;
  max_group_size?: number;
  price_per_person: string | number;
  image_urls: string[];
  rating?: number;
  reviews_count?: number;
}

export function useTourDetails(tourId: string) {
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!tourId) return;

    const loadTourData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const isNumericId = /^\d+$/.test(String(tourId));
        const endpoint = isNumericId
          ? `${API_PREFIX}/tours/${tourId}`
          : `${API_PREFIX}/tours/by-slug/${encodeURIComponent(String(tourId))}`;

        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.tour) {
          throw new Error('Tour not found in response');
        }
        
        const foundTour = data.tour;
        
        // Process tour data to ensure consistent format
        const processedTour: Tour = {
          ...foundTour,
          duration: foundTour.duration || '2 hours',
          max_group_size: foundTour.max_group_size || 12,
          rating: foundTour.rating || 4.8,
          reviews_count: foundTour.reviews_count || 100,
          image_urls: (Array.isArray(foundTour.image_urls) && foundTour.image_urls.length > 0) 
            ? foundTour.image_urls 
            : ['https://images.unsplash.com/photo-1539650116574-75c0c6d2d167?w=800&h=400&fit=crop']
        };
        
        setTour(processedTour);
        
      } catch (err: any) {
        console.error('Error loading tour:', err);
        setError(err.message || 'Failed to load tour details');
        setTour(null);
      } finally {
        setLoading(false);
      }
    };

    loadTourData();
  }, [tourId]);

  return { tour, loading, error };
}