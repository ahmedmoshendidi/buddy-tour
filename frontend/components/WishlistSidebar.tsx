import React from 'react';
import { useWishlist } from './WishlistContext';
import { useCurrency } from './CurrencyContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Heart, Star, Clock, Trash2, Eye, Calendar } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Tour } from '../hooks/useTourDetails';

interface WishlistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onViewTourDetails: (tour: Tour) => void;
  onBookNow: (tour: Tour) => void;
}

export default function WishlistSidebar({ 
  isOpen, 
  onClose, 
  onViewTourDetails, 
  onBookNow 
}: WishlistSidebarProps) {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { formatPrice } = useCurrency();

  const handleViewTour = (tour: Tour) => {
    onClose();
    onViewTourDetails(tour);
  };

  const handleCheckAvailability = (tour: Tour) => {
    onClose();
    onBookNow(tour); // This navigates to tickets page
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-white">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-primary">
            <Heart className="h-5 w-5 text-primary" />
            Wishlist
          </SheetTitle>
          <SheetDescription>
            Your saved tours - compare and book when you're ready!
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {wishlist.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center">
                <Heart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No wishlist items yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Save tours you love to compare and book later!
              </p>
              <Button onClick={onClose} variant="outline">
                Browse Tours
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header with clear all */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {wishlist.length} tour{wishlist.length !== 1 ? 's' : ''} saved
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearWishlist}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              </div>

              {/* Wishlist Items */}
              <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                {wishlist.map((tour) => (
                  <Card key={tour.id} className="overflow-hidden border border-border hover:shadow-md transition-shadow">
                    <div className="flex">
                      {/* Tour Image */}
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <ImageWithFallback
                          src={tour.image_urls?.[0] || 'https://images.unsplash.com/photo-1539650116574-75c0c6d2d167?w=200&h=200&fit=crop'}
                          alt={tour.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Tour Details */}
                      <div className="flex-1 p-3">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium text-sm leading-tight line-clamp-1">{tour.title}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromWishlist(tour.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-medium">{tour.rating || 4.8}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{tour.duration}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary">
                            {formatPrice(tour.price_per_person)}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTour(tour)}
                              className="h-7 px-2 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleCheckAvailability(tour)}
                              className="h-7 px-2 text-xs bg-gradient-to-r from-primary to-teal-600 hover:from-teal-700 hover:to-teal-700"
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              Check Availability
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Bottom actions */}
              <div className="pt-4 border-t border-border">
                <Button 
                  onClick={onClose} 
                  className="w-full bg-gradient-to-r from-amber-500 to-coral-500 hover:from-amber-600 hover:to-coral-600"
                >
                 <Heart className="h-4 w-4 mr-2" />
                  Continue Browsing
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}