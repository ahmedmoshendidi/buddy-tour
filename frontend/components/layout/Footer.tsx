import React from 'react';
import { Compass } from 'lucide-react';

interface FooterProps {
  onViewTourById: (tourId: number) => void;
}

export default function Footer({ onViewTourById }: FooterProps) {
  return (
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
              <li><button onClick={() => onViewTourById(1)} className="hover:text-primary transition-colors">Bibliotheca Alexandrina</button></li>
              <li><button onClick={() => onViewTourById(2)} className="hover:text-primary transition-colors">Roman Theatre</button></li>
              <li><button onClick={() => onViewTourById(3)} className="hover:text-primary transition-colors">Montaza Palace</button></li>
              <li><button onClick={() => onViewTourById(4)} className="hover:text-primary transition-colors">Qaitbay Citadel</button></li>
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
  );
}