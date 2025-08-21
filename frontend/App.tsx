import React, { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import 'flag-icons/css/flag-icons.min.css';
import 'index.css';

import { ImageWithFallback } from './components/figma/ImageWithFallback';
import TourDetails from './components/TourDetails';
import TicketsQuantity from './components/TicketsQuantity';
import CheckoutProcess from './components/CheckoutProcess';
import { CurrencyProvider, useCurrency } from './components/CurrencyContext';
import CurrencySelector from './components/CurrencySelector';
import { Clock, Users, MapPin, Star, Calendar, Shield, Compass, Globe } from 'lucide-react';
import { API_PREFIX } from './config';

type AppView = 'home' | 'tour-details' | 'tickets' | 'checkout';

interface Tour {
  id: number;
  title: string;
  description: string;
  duration: string;
  max_group_size: number;
  price_per_person: string;
  image_urls: string[];
  rating?: number;
  reviews_count?: number;
}

const heroImages = [
  {
    src: '/images/bibliotheca-alexandrina.webp',
    title: 'Bibliotheca Alexandrina',
    subtitle: 'Modern Library of Alexandria'
  },
  {
    src: '/images/roman-theatre.webp',
    title: 'Roman Theatre',
    subtitle: 'Ancient Roman Architecture'
  },
  {
    src: '/images/montaza-palace.webp',
    title: 'Montaza Palace',
    subtitle: 'Royal Gardens & Palace'
  },
  {
    src: '/images/qaitbay-citadel.webp',
    title: 'Qaitbay Citadel',
    subtitle: 'Historic Fortress by the Sea'
  }
];

// Inner App component that uses currency context
function AppContent() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedTourId, setSelectedTourId] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { formatPrice } = useCurrency();

  // Load tours from real API only
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Navigation handlers
  const handleViewTourDetails = (tourId: number) => {
    setSelectedTourId(tourId);
    setCurrentView('tour-details');
  };

  const handleBookNow = (tourId: number) => {
    setSelectedTourId(tourId);
    setCurrentView('tickets');
  };

  const handleProceedToCheckout = () => {
    setCurrentView('checkout');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedTourId(null);
  };

  const handleBackToTourDetails = () => {
    setCurrentView('tour-details');
  };

  const handleBackToTickets = () => {
    setCurrentView('tickets');
  };

  // Scroll to tours section - used by hero button
  const handleExploreTours = () => {
    const toursSection = document.getElementById('tours');
    if (toursSection) {
      toursSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const currentImage = heroImages[currentImageIndex];

  // Render different views based on currentView
  if (currentView === 'tour-details' && selectedTourId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg shadow-md">
                <Compass className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
                BuddyTour
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <CurrencySelector />
              <nav className="hidden md:flex items-center space-x-6">
                <button onClick={handleBackToHome} className="hover:text-primary transition-colors font-medium">
                  Back to Home
                </button>
              </nav>
            </div>
          </div>
        </header>
        
        <TourDetails 
          tourId={selectedTourId}
          onBack={handleBackToHome}
          onBookNow={handleBookNow}
        />
      </div>
    );
  }

  if (currentView === 'tickets' && selectedTourId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg shadow-md">
                <Compass className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
                BuddyTour
              </h1>
            </div>
            <CurrencySelector />
          </div>
        </header>
        
        <TicketsQuantity 
          tourId={selectedTourId}
          onBack={handleBackToTourDetails}
          onCheckout={handleProceedToCheckout}
        />
      </div>
    );
  }

  if (currentView === 'checkout') {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg shadow-md">
                <Compass className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
                BuddyTour
              </h1>
            </div>
            <CurrencySelector />
          </div>
        </header>
        
        <CheckoutProcess onBack={handleBackToTickets} />
      </div>
    );
  }

  // Main homepage
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg shadow-md">
              <Compass className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
              BuddyTour
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <CurrencySelector />
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#how-it-works" className="hover:text-primary transition-colors font-medium">How it Works</a>
              <a href="#about" className="hover:text-primary transition-colors font-medium">About</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[600px] overflow-hidden">
        <div className="absolute inset-0 transition-all duration-1000">
          <ImageWithFallback
            src={currentImage.src}
            alt={currentImage.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
          {/* Arabic-inspired decorative element */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
            <div className="w-full h-full bg-gradient-to-br from-amber-400 to-coral-500 rounded-full blur-3xl"></div>
          </div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <div className="flex items-center mb-4">
              <Globe className="h-6 w-6 mr-2 text-amber-400" />
              <span className="text-amber-400 font-medium">Discover Alexandria</span>
            </div>
            <h2 className="text-4xl md:text-5xl mb-4 text-white">
              Explore {currentImage.title} with Local Experts
            </h2>
            <p className="text-xl mb-2 text-white/90 font-medium">
              {currentImage.subtitle}
            </p>
            <p className="text-lg mb-8 text-white/80">
              Book unique experiences led by verified local guides in the beautiful coastal city of Alexandria, Egypt. 
              Connect with authentic Arabic culture and Mediterranean heritage.
            </p>
            <div className="flex justify-center sm:justify-start">
              <Button 
                size="lg" 
                onClick={handleExploreTours}
                className="bg-white text-black hover:bg-amber-50 hover:text-primary shadow-lg border-2 border-transparent hover:border-amber-200"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Explore Tours
              </Button>
            </div>
          </div>
        </div>

        {/* Hero Image Indicators with Arabic-inspired styling */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all border-2 ${
                index === currentImageIndex 
                  ? 'bg-amber-400 border-amber-400 shadow-lg' 
                  : 'bg-white/30 border-white/50 hover:bg-white/50'
              }`}
              onClick={() => setCurrentImageIndex(index)}
            />
          ))}
        </div>
      </section>

      {/* Cultural Banner */}
      <section className="py-4 bg-gradient-to-r from-primary to-teal-600">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center text-center text-white">
            <Star className="h-5 w-5 mr-2 text-amber-400" />
            <span className="font-medium">Experience authentic Arabic hospitality • Discover 2,000+ years of history • Mediterranean coastal beauty</span>
            <Star className="h-5 w-5 ml-2 text-amber-400" />
          </div>
        </div>
      </section>

      {/* Featured Tours */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tours.map((tour) => (
                <Card 
                  key={tour.id} 
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 group border border-border hover:border-primary/20 bg-gradient-to-b from-white to-teal-50/30 cursor-pointer"
                  onClick={() => handleViewTourDetails(tour.id)}
                >
                  <div className="relative">
                    <ImageWithFallback
                      src={tour.image_urls?.[0] || 'https://images.unsplash.com/photo-1539650116574-75c0c6d2d167?w=400&h=250&fit=crop'}
                      alt={tour.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

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
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-gradient-to-b from-muted/30 to-amber-50/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center mb-4 px-4 py-2 bg-gradient-to-r from-amber-50 to-teal-50 rounded-full">
              <Globe className="h-5 w-5 mr-2 text-amber-600" />
              <span className="text-primary font-medium">Simple Process</span>
            </div>
            <h3 className="text-3xl mb-4">How BuddyTour Works</h3>
            <p className="text-lg text-muted-foreground">
              Connect with local Arabic culture in four simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: 1,
                title: 'Choose Your Adventure',
                description: 'Browse our curated selection of authentic walking tours led by verified local guides.',
                icon: Compass,
                color: 'from-primary to-teal-600'
              },
              {
                step: 2,
                title: 'Select Date & Time',
                description: 'Pick your preferred date, time slot, and number of guests for your tour experience.',
                icon: Calendar,
                color: 'from-amber-500 to-coral-500'
              },
              {
                step: 3,
                title: 'Book Securely',
                description: 'Provide your details and complete payment securely through our encrypted booking system.',
                icon: Shield,
                color: 'from-coral-500 to-primary'
              },
              {
                step: 4,
                title: 'Explore & Connect',
                description: 'Meet your local buddy and discover Alexandria\'s hidden gems and authentic Arabic hospitality.',
                icon: Star,
                color: 'from-teal-500 to-amber-500'
              }
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-sm text-amber-600 mb-2 font-medium">Step {item.step}</div>
                <h4 className="mb-3 font-semibold">{item.title}</h4>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 bg-gradient-to-r from-primary to-teal-600">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
            <div>
              <div className="text-3xl font-bold mb-2">2000+</div>
              <div className="text-white/90">Years of History</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="text-white/90">Verified Local Guides</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">4.8★</div>
              <div className="text-white/90">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary to-teal-600 rounded-lg shadow-md">
                  <Compass className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
                  BuddyTour
                </h1>
              </div>
              <p className="text-muted-foreground">
                Connecting travelers with local guides for authentic Alexandria experiences rooted in Arabic culture and Mediterranean heritage.
              </p>
            </div>
            
            <div>
              <h4 className="mb-4 font-semibold text-primary">Tours</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => handleViewTourDetails(1)} className="hover:text-primary transition-colors">Bibliotheca Alexandrina</button></li>
                <li><button onClick={() => handleViewTourDetails(2)} className="hover:text-primary transition-colors">Roman Theatre</button></li>
                <li><button onClick={() => handleViewTourDetails(3)} className="hover:text-primary transition-colors">Montaza Palace</button></li>
                <li><button onClick={() => handleViewTourDetails(4)} className="hover:text-primary transition-colors">Qaitbay Citadel</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-4 font-semibold text-primary">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cancellation Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Safety</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-4 font-semibold text-primary">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Become a Guide</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Press</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 BuddyTour. All rights reserved. | Made with ❤️ in Alexandria, Egypt</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Main App component wrapped with CurrencyProvider
export default function App() {
  return (
    <CurrencyProvider>
      <AppContent />
    </CurrencyProvider>
  );
}