import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Heart, ShoppingCart, CheckCircle } from 'lucide-react';
import { useWishlist } from '../WishlistContext';
import { useCart } from '../CartContext';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import WishlistSidebar from '../WishlistSidebar';
import CartSidebar from '../CartSidebar';
import BookingsSidebar from '../BookingsSidebar';
import CurrencySelector from '../CurrencySelector';

export default function Header() {
  const { wishlist } = useWishlist();
  const { unpaidTours, paidTours } = useCart();
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg shadow-md">
              <Compass className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
              BuddyTour
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Wishlist Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsWishlistOpen(true)}
              className="flex flex-col items-center p-2 h-auto hover:bg-muted/50"
            >
              <div className="relative">
                <Heart className="h-6 w-6 text-muted-foreground hover:text-coral-500 transition-colors" />
                {wishlist.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-coral-500 hover:bg-coral-600 text-white text-xs flex items-center justify-center min-w-[20px]">
                    {wishlist.length}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground mt-1">Wishlist</span>
            </Button>

            {/* Cart Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCartOpen(true)}
              className="flex flex-col items-center p-2 h-auto hover:bg-muted/50"
            >
              <div className="relative">
                <ShoppingCart className="h-6 w-6 text-muted-foreground hover:text-coral-500 transition-colors" />
                {unpaidTours.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-coral-500 hover:bg-coral-600 text-white text-xs flex items-center justify-center min-w-[20px]">
                    {unpaidTours.length}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground mt-1">Cart</span>
            </Button>

            {/* Bookings Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBookingsOpen(true)}
              className="flex flex-col items-center p-2 h-auto hover:bg-muted/50"
            >
              <div className="relative">
                <CheckCircle className="h-6 w-6 text-muted-foreground hover:text-green-600 transition-colors" />
                {paidTours.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-green-500 hover:bg-green-600 text-white text-xs flex items-center justify-center min-w-[20px]">
                    {paidTours.length}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground mt-1">Bookings</span>
            </Button>

            <CurrencySelector />

            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/tour-guide-application"
                className="hover:text-primary transition-colors font-medium"
              >
                Become a Tour Guide
              </Link>
              <Link
                to="/about"
                className="hover:text-primary transition-colors font-medium"
              >
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Wishlist Sidebar */}
      <WishlistSidebar
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        onViewTourDetails={() => {}}
        onBookNow={() => {}}
      />

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onPayNow={(slug) => navigate(`/checkout/${slug}`)}
      />

      {/* Bookings Sidebar */}
      <BookingsSidebar
        isOpen={isBookingsOpen}
        onClose={() => setIsBookingsOpen(false)}
      />
    </>
  );
}
