import React from 'react';
import { CurrencyProvider } from './components/CurrencyContext';
import { WishlistProvider, useWishlist } from './components/WishlistContext';
import { CartProvider, useCart } from './components/CartContext';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useTours } from './hooks/useTours';

// Page Components
import HomePage from './components/pages/HomePage';
import PaymentResultPage from './components/pages/PaymentResultPage';

// Other Components
import Header from './components/layout/Header';
import TourDetails from './components/TourDetails';
import TicketsQuantity from './components/TicketsQuantity';
import CheckoutProcess from './components/CheckoutProcess';
import WishlistNotification from './components/WishlistNotification';
import CartNotification from './components/CartNotification';
import type { Tour } from './hooks/useTourDetails';

// Inner App component that uses currency and favorites context
function AppContent() {
  const {
    currentView,
    selectedTourSlug,
    navigateToHome,
    navigateToTourDetails,
    navigateToTickets,
    navigateToCheckout
  } = useAppNavigation();

  const { tours, loading, error } = useTours();
  const { notificationTour, showNotification, hideNotification } = useWishlist();
  const { notificationTour: cartNotificationTour, showNotification: showCartNotification, hideNotification: hideCartNotification } = useCart();

  // Navigation handlers
  const handleViewTourDetails = (tour: Tour) => {
    const slug = tour.slug || tour.id.toString();
    navigateToTourDetails(slug);
  };

  const handleBookNow = (tour: Tour) => {
    const slug = tour.slug || tour.id.toString();
    navigateToTickets(slug);
  };

  const handleViewTourById = (tourId: number) => {
    navigateToTourDetails(tourId.toString());
  };

  const handleRetryPayment = () => {
    navigateToCheckout();
  };

  // Render Payment Success or Failure pages
  if (currentView === 'payment-success' || currentView === 'payment-failure') {
    return (
      <PaymentResultPage
        isSuccess={currentView === 'payment-success'}
        onBackToHome={navigateToHome}
        onRetryPayment={handleRetryPayment}
        onViewTourDetails={handleViewTourDetails}
        onBookNow={handleBookNow}
      />
    );
  }

  // Render Tour Details page
  if (currentView === 'tour-details' && selectedTourSlug) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          onViewTourDetails={handleViewTourDetails} 
          onBookNow={handleBookNow}
          onPayNow={navigateToCheckout}
          onBackToHome={navigateToHome}
          showBackToHome={true}
        />
        
        <TourDetails 
          tourId={selectedTourSlug}
          onBack={navigateToHome}
          onBookNow={handleBookNow}
        />

        <WishlistNotification 
          tour={notificationTour}
          isVisible={showNotification}
          onClose={hideNotification}
        />
        <CartNotification 
          tour={cartNotificationTour}
          isVisible={showCartNotification}
          onClose={hideCartNotification}
        />
      </div>
    );
  }

  // Render Tickets page
  if (currentView === 'tickets' && selectedTourSlug) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          onViewTourDetails={handleViewTourDetails} 
          onBookNow={handleBookNow}
          onPayNow={navigateToCheckout}
        />
        
        <TicketsQuantity 
          tourId={selectedTourSlug || '0'}
          onBack={() => navigateToTourDetails(selectedTourSlug)}
          onCheckout={navigateToCheckout}
        />

        <WishlistNotification 
          tour={notificationTour}
          isVisible={showNotification}
          onClose={hideNotification}
        />
        <CartNotification 
          tour={cartNotificationTour}
          isVisible={showCartNotification}
          onClose={hideCartNotification}
        />
      </div>
    );
  }

  // Render Checkout page
  if (currentView === 'checkout') {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          onViewTourDetails={handleViewTourDetails} 
          onBookNow={handleBookNow}
          onPayNow={navigateToCheckout}
        />
        
        <CheckoutProcess 
          onBack={() => navigateToTickets(selectedTourSlug || '')} 
        />

        <WishlistNotification 
          tour={notificationTour}
          isVisible={showNotification}
          onClose={hideNotification}
        />
        <CartNotification 
          tour={cartNotificationTour}
          isVisible={showCartNotification}
          onClose={hideCartNotification}
        />
      </div>
    );
  }

  // Render Homepage
  return (
    <HomePage
      tours={tours}
      loading={loading}
      error={error}
      onViewTourDetails={handleViewTourDetails}
      onBookNow={handleBookNow}
      onViewTourById={handleViewTourById}
    />
  );
}

// Main App component wrapped with both providers
export default function App() {
  return (
    <CurrencyProvider>
      <WishlistProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </WishlistProvider>
    </CurrencyProvider>
  );
}