import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Calendar, Globe } from 'lucide-react';

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

interface HeroSectionProps {
  onExploreTours: () => void;
}

export default function HeroSection({ onExploreTours }: HeroSectionProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentImage = heroImages[currentImageIndex];

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[600px] overflow-hidden">
        <div className="absolute inset-0 transition-all duration-1000">
          <ImageWithFallback
            src={currentImage.src}
            alt={currentImage.title}
            className="w-full h-full object-cover"
            fetchPriority={currentImageIndex === 0 ? "high" : "auto"}
            loading={currentImageIndex === 0 ? "eager" : "lazy"}
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
                onClick={onExploreTours}
                className="bg-white text-black hover:bg-amber-50 hover:text-primary shadow-lg border-2 border-transparent hover:border-amber-200"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Explore Tours
              </Button>
            </div>
          </div>
        </div>

        {/* Hero Image Indicators */}
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
            <span className="font-medium">Experience authentic Arabic hospitality • Discover 2,000+ years of history • Mediterranean coastal beauty</span>
          </div>
        </div>
      </section>
    </>
  );
}