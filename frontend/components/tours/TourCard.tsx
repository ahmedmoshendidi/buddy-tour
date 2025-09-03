import React from 'react';
import { Card, CardContent } from '../ui/card';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useWishlist } from '../WishlistContext';
import { useCurrency } from '../CurrencyContext';
import { Star, Clock, Users, Heart } from 'lucide-react';
import type { Tour } from '../../hooks/useTourDetails';

interface TourCardProps {
  tour: Tour;
  onViewTourDetails: (tour: Tour) => void;
}

export default function TourCard({ tour, onViewTourDetails }: TourCardProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    const tourForWishlist = {
      ...tour,
      price_per_person: typeof tour.price_per_person === 'string' 
        ? parseFloat(tour.price_per_person.replace('$', '')) 
        : tour.price_per_person,
      duration: tour.duration || '2 hours',
      max_group_size: tour.max_group_size || 10,
      rating: tour.rating || 4.8,
      reviews_count: tour.reviews_count || 100
    };
    
    if (isInWishlist(tour.id)) {
      removeFromWishlist(tour.id);
    } else {
      addToWishlist(tourForWishlist);
    }
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-xl transition-all duration-300 group border border-border hover:border-primary/20 bg-gradient-to-b from-white to-teal-50/30 cursor-pointer"
      onClick={() => onViewTourDetails(tour)}
    >
      <div className="relative">
        <ImageWithFallback
          src={tour.image_urls?.[0] || 'https://images.unsplash.com/photo-1539650116574-75c0c6d2d167?w=400&h=250&fit=crop'}
          alt={tour.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Heart icon for wishlist */}
        <button
          onClick={handleToggleFavorite}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
            isInWishlist(tour.id)
              ? 'bg-coral-500 text-white shadow-lg'
              : 'bg-white/80 backdrop-blur-sm text-coral-500 hover:bg-coral-500 hover:text-white'
          }`}
        >
          <Heart className={`h-4 w-4 transition-all duration-200 ${
            isInWishlist(tour.id) ? 'fill-current' : ''
          }`} />
        </button>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="ml-1 font-medium">{tour.rating || 4.8}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ({tour.reviews_count || 100} reviews)
          </span>
        </div>
        
        <h4 className="mb-2 font-semibold">{tour.title}</h4>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {tour.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1 text-primary" />
            <span>Up to {tour.max_group_size}</span>
          </div>
        </div>
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <Clock className="h-4 w-4 mr-1 text-primary" />
          <span>{tour.duration}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-semibold text-primary">
              {formatPrice(typeof tour.price_per_person === 'string' 
                ? parseFloat(tour.price_per_person.replace('$', '')) 
                : tour.price_per_person
              )}
            </span>
            <span className="text-sm text-muted-foreground">/person</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}