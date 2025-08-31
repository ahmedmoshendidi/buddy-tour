import React from 'react';
import { Button } from '../ui/button';
import { Compass } from 'lucide-react';
import TourCard from './TourCard';
import type { Tour } from '../../hooks/useTourDetails';

interface ToursGridProps {
  tours: Tour[];
  loading: boolean;
  error: string;
  onViewTourDetails: (tour: Tour) => void;
}

export default function ToursGrid({ tours, loading, error, onViewTourDetails }: ToursGridProps) {
  return (
    <section id="tours" className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center mb-4 px-4 py-2 bg-gradient-to-r from-teal-50 to-amber-50 rounded-full">
            <Compass className="h-5 w-5 mr-2 text-primary" />
            <span className="text-primary font-medium">Featured Experiences</span>
          </div>
          <h3 className="text-3xl mb-4">Alexandria's Finest Walking Tours</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover Alexandria's most iconic landmarks with experienced local guides who bring history to life 
            through authentic Arabic storytelling and cultural insights.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tours...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-destructive mb-4">❌ {error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="tours-grid">
            {tours.map((tour) => (
              <TourCard 
                key={tour.id} 
                tour={tour}
                onViewTourDetails={onViewTourDetails}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}