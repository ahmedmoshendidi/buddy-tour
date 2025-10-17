import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t py-12 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* --- Company Logo and Description --- */}
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

          {/* --- Tours Section --- */}
          <div>
            <h4 className="mb-4 font-semibold text-primary">Tours</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/tour/1" className="hover:text-primary transition-colors">Bibliotheca Alexandrina</Link></li>
              <li><Link to="/tour/2" className="hover:text-primary transition-colors">Roman Theatre</Link></li>
              <li><Link to="/tour/3" className="hover:text-primary transition-colors">Montaza Palace</Link></li>
              <li><Link to="/tour/4" className="hover:text-primary transition-colors">Qaitbay Citadel</Link></li>
            </ul>
          </div>

          {/* --- Support Section --- */}
          <div>
            <h4 className="mb-4 font-semibold text-primary">Support</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Email: <a href="mailto:support@buddytourguide.com" className="hover:text-primary transition-colors">support@buddytourguide.com</a></p>
              <p>Phone: <a href="tel:01029031487" className="hover:text-primary transition-colors">01029031487</a></p>
              <p>
                <Link to="/cancellation-policy" className="hover:text-primary transition-colors">
                  Cancellation Policy
                </Link>
              </p>
              <p>
                <Link to="/service-duration-policy" className="hover:text-primary transition-colors">
                  Service Duration Policy
                </Link>
              </p>
            </div>
          </div>

          {/* --- Company Section --- */}
          <div>
            <h4 className="mb-4 font-semibold text-primary">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/become-tour-guide" className="hover:text-primary transition-colors">Become a Guide</Link></li>
              <li><Link to="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
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
