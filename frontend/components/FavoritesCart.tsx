import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useFavorites } from './FavoritesContext';
import { useCurrency } from './CurrencyContext';
import { Star, Clock, Users, Trash2, ShoppingCart, Calendar, CreditCard } from 'lucide-react';
import CountdownTimer from './ui/CountdownTimer';
import type { Tour } from '../hooks/useTourDetails';

interface FavoritesCartProps {
  onViewTourDetails: (tour : Tour) => void;
  onBookNow: (tour: Tour) => void;
  onPayNow?: () => void; // For navigating to checkout
}

export default function FavoritesCart({ onViewTourDetails, onBookNow, onPayNow }: FavoritesCartProps) {
  const { 
    favorites, 
    removeFromFavorites, 
    clearFavorites,
    bookedTours,
    removeBookedTour,
    clearBookedTours
  } = useFavorites();
  const { formatPrice } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'booked' | 'favorites'>('booked');

  const handleViewTour = (tour: Tour) => {
    setIsOpen(false);
    onViewTourDetails(tour);
  };

  const handleBookTour = (tour : Tour) => {
    setIsOpen(false);
    onBookNow(tour);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 hover:bg-muted/50 [&_svg]:!h-6 [&_svg]:!w-6"
        >
          <ShoppingCart className="text-muted-foreground hover:text-coral-500 transition-colors" />
          {(bookedTours.length + favorites.length) > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-coral-500 hover:bg-coral-600 text-white text-xs flex items-center justify-center min-w-[20px]">
              {bookedTours.length + favorites.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      
      <SheetContent className="w-[400px] sm:w-[540px] bg-white">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-primary">
            <ShoppingCart className="h-5 w-5 text-primary" />
                Saved Tours
            </SheetTitle>
          <SheetDescription>
            Your saved tours - book them when you're ready!
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('booked')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'booked' 
                  ? 'border-coral-500 text-coral-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Cart ({bookedTours.length})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'favorites'
                  ? 'border-coral-500 text-coral-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Favorites ({favorites.length})
            </button>
          </div>

          {/* Booked Tours Tab */}
          {activeTab === 'booked' && (
            bookedTours.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No tours in cart</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Book tours and they'll appear here with your reservation timer!
                </p>
                <Button onClick={() => setIsOpen(false)} variant="outline">
                  Browse Tours
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header with clear all */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {bookedTours.length} tour{bookedTours.length !== 1 ? 's' : ''} in cart
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearBookedTours}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear all
                  </Button>
                </div>

                {/* Booked Tours List */}
                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                  {bookedTours.map((bookedTour) => (
                    <BookedTourCard 
                      key={bookedTour.id}
                      bookedTour={bookedTour}
                      onRemove={() => removeBookedTour(bookedTour.id)}
                      onPayNow={() => {
                        // Set booking data and navigate to checkout
                        const bookingData = {
                          tour_id: bookedTour.tourId,
                          date: bookedTour.date,
                          time: bookedTour.time,
                          adults: bookedTour.adults,
                          children: bookedTour.children,
                          total_amount: bookedTour.totalAmount,
                          price_per_person: bookedTour.pricePerPerson,
                          session_id: bookedTour.sessionId,
                          hold_expires_at: bookedTour.holdExpiresAt
                        };
                        localStorage.setItem('bookingData', JSON.stringify(bookingData));
                        setIsOpen(false);
                        onPayNow?.();
                      }}
                      formatPrice={formatPrice}
                    />
                  ))}
                </div>
              </div>
            )
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            favorites.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No favorite tours yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start exploring and save tours you love!
              </p>
              <Button onClick={() => setIsOpen(false)} variant="outline">
                Browse Tours
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header with clear all */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {favorites.length} tour{favorites.length !== 1 ? 's' : ''} saved
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFavorites}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              </div>

              {/* Favorites list */}
              <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                {favorites.map((tour) => (
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
                            onClick={() => removeFromFavorites(tour.id)}
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
                              View
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleBookTour(tour)}
                              className="h-7 px-2 text-xs bg-gradient-to-r from-primary to-teal-600 hover:from-teal-700 hover:to-teal-700"
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              Book
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
                  onClick={() => setIsOpen(false)} 
                  className="w-full bg-gradient-to-r from-amber-500 to-coral-500 hover:from-amber-600 hover:to-coral-600"
                >
                 <ShoppingCart className="h-4 w-4 mr-2" />
                  Continue Browsing
                </Button>
              </div>
            </div>
          )
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// BookedTour interface (matching FavoritesContext)
interface BookedTour {
  id: string;
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

// BookedTourCard component
interface BookedTourCardProps {
  bookedTour: BookedTour;
  onRemove: () => void;
  onPayNow: () => void;
  formatPrice: (amount: number) => string;
}

function BookedTourCard({ bookedTour, onRemove, onPayNow, formatPrice }: BookedTourCardProps) {
  const isExpired = new Date(bookedTour.holdExpiresAt) <= new Date();

  return (
    <Card className={`overflow-hidden border ${isExpired ? 'border-red-200 bg-red-50' : 'border-border hover:shadow-md'} transition-shadow`}>
      <div className="p-4">
        {/* Tour Title and Remove Button */}
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium text-sm leading-tight">{bookedTour.tourTitle}</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Tour Details */}
        <div className="space-y-2 text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(bookedTour.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{bookedTour.time}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>
              {bookedTour.adults} adult{bookedTour.adults !== 1 ? 's' : ''}
              {bookedTour.children > 0 && `, ${bookedTour.children} child${bookedTour.children !== 1 ? 'ren' : ''}`}
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-primary">
            {formatPrice(bookedTour.totalAmount)}
          </span>
        </div>

        {/* Countdown Timer */}
        {!isExpired && (
          <div className="mb-3">
            <CountdownTimer
              expirationTime={bookedTour.holdExpiresAt}
              className="!p-2 !text-xs"
              onExpire={() => {
                // Timer will show expired state
              }}
            />
          </div>
        )}

        {/* Action Button */}
        {isExpired ? (
          <Button 
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
            disabled
          >
            Hold Expired
          </Button>
        ) : (
          <Button 
            onClick={onPayNow}
            className="w-full bg-gradient-to-r from-primary to-teal-600 hover:from-teal-700 hover:to-teal-700 text-sm py-2"
          >
            <CreditCard className="h-3 w-3 mr-2" />
            Pay Now
          </Button>
        )}
      </div>
    </Card>
  );
}