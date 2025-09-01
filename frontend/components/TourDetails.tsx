import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useCurrency } from './CurrencyContext';
import { useTourDetails, Tour } from '../hooks/useTourDetails';
import { useSEO } from '../hooks/useSEO';

import { ImageWithFallback } from './figma/ImageWithFallback';
import { ArrowLeft, MapPin, Clock, Users, Star, CheckCircle, Compass } from 'lucide-react';

interface TourDetailsProps {
  tourId: string; // slug
  onBack: () => void;
  onBookNow: (tour: Tour) => void;
}

export default function TourDetails({ tourId, onBack, onBookNow }: TourDetailsProps) {
  const { tour, loading, error } = useTourDetails(tourId);
  const { formatPrice } = useCurrency();

  // Update SEO metadata when tour data is available
  useSEO({
    title: tour ? `${tour.title} - BuddyTour` : undefined,
    description: tour?.description,
    image: tour?.image_urls?.[0],
    url: typeof window !== 'undefined' ? window.location.href : undefined
  });


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-amber-50/20 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tour details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-amber-50/20 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" onClick={onBack} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tours
          </Button>
          <Card className="text-center py-20">
            <CardContent>
              <p className="text-destructive mb-4">❌ {error || 'Tour not found'}</p>
              <Button onClick={onBack}>Return to Tours</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Extract numeric price for currency conversion
  const numericPrice = typeof tour.price_per_person === 'number' 
    ? tour.price_per_person 
    : parseFloat(tour.price_per_person.toString().replace('$', ''));

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-amber-50/20 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" onClick={onBack} className="mb-6 hover:bg-white/50">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tours
        </Button>

        {/* Tour Details Card */}
        <Card className="shadow-xl border border-border/50 overflow-hidden">
          {/* Hero Image */}
          <div className="relative h-96 overflow-hidden">
            <ImageWithFallback
              src={tour.image_urls?.[0] || 'https://images.unsplash.com/photo-1539650116574-75c0c6d2d167?w=800&h=400&fit=crop'}
              alt={`${tour.title} by BuddyTour`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            

            



          </div>

          <CardContent className="p-8">
            {/* Title and Rating */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{tour.rating}</span>
                  <span className="text-muted-foreground">({tour.reviews_count} reviews)</span>
                </div>
                <div className="ml-auto">
                  <span className="text-2xl font-bold text-primary">{formatPrice(numericPrice)}</span>
                  <span className="text-muted-foreground">/person</span>
                </div>
              </div>
              
              <h1 className="text-3xl mb-4 text-foreground">{tour.title}</h1>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl mb-4 text-primary">About This Tour</h2>
              <p className="text-muted-foreground leading-relaxed text-base">
                {tour.description}
              </p>
            </div>

            {/* Tour Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-amber-50 rounded-lg border">
                <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="font-medium">Duration</div>
                <div className="text-muted-foreground">{tour.duration}</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-coral-50 rounded-lg border">
                <Users className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                <div className="font-medium">Group Size</div>
                <div className="text-muted-foreground">Max {tour.max_group_size} people</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-coral-50 to-teal-50 rounded-lg border">
                <MapPin className="h-8 w-8 text-coral-600 mx-auto mb-2" />
                <div className="font-medium">Location</div>
                <div className="text-muted-foreground">Alexandria, Egypt</div>
              </div>
            </div>

            {/* What's Included */}
            <div className="mb-8">
              <h3 className="text-lg mb-4 text-primary">What's Included</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Professional local guide',
                  'Historical insights and stories',
                  'Small group experience',
                  'Photo opportunities',
                  'Cultural context and background',
                  'Walking tour of main sites'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Local Expertise */}
            <div className="bg-gradient-to-r from-primary/5 to-teal-50 p-6 rounded-lg border border-primary/10 mb-8">
              <h3 className="text-lg mb-3 text-primary flex items-center">
                <Compass className="h-5 w-5 mr-2" />
                Local Expertise
              </h3>
              <p className="text-sm text-muted-foreground">
                Experience Alexandria through the eyes of passionate local guides with deep knowledge of the city's history and culture. 
                Discover authentic stories and hidden gems that only locals know about.
              </p>
            </div>

            {/* Book Now Button */}
            <div className="text-center">
              <Button 
                size="lg" 
                onClick={() => onBookNow(tour)}
                className="bg-gradient-to-r from-primary to-teal-600 hover:from-teal-700 hover:to-teal-700 shadow-lg px-8 py-3 text-lg"
              >
                Book This Tour Now
                <ArrowLeft className="h-5 w-5 ml-2 rotate-180" />
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Free cancellation up to 24 hours before the tour
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}