import React from 'react';
import { Compass } from 'lucide-react';
import FavoritesCart from '../FavoritesCart';
import CurrencySelector from '../CurrencySelector';
import type { Tour } from '../../hooks/useTourDetails';

interface HeaderProps {
  onViewTourDetails: (tour: Tour) => void;
  onBookNow: (tour: Tour) => void;
  onPayNow?: () => void;
  onBackToHome?: () => void;
  showBackToHome?: boolean;
}

export default function Header({ 
  onViewTourDetails, 
  onBookNow, 
  onPayNow,
  onBackToHome,
  showBackToHome = false 
}: HeaderProps) {
  return (
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
        <div className="flex items-center space-x-2">
          <FavoritesCart onViewTourDetails={onViewTourDetails} onBookNow={onBookNow} onPayNow={onPayNow} />
          <CurrencySelector />
          {showBackToHome && onBackToHome && (
            <nav className="hidden md:flex items-center space-x-6">
              <button 
                onClick={onBackToHome} 
                className="hover:text-primary transition-colors font-medium"
              >
                Back to Home
              </button>
            </nav>
          )}
          {!showBackToHome && (
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#how-it-works" className="hover:text-primary transition-colors font-medium">How it Works</a>
              <a href="#about" className="hover:text-primary transition-colors font-medium">About</a>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}