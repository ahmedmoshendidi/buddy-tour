import React from 'react';
import { CurrencyProvider } from './components/CurrencyContext';
import { WishlistProvider, useWishlist } from './components/WishlistContext';
import { CartProvider, useCart } from './components/CartContext';
import SuccessCleanup from './components/SuccessCleanup';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useTours } from './hooks/useTours';

// Page Components
import HomePage from './components/pages/HomePage';
import PaymentResultPage from './components/pages/PaymentResultPage';
import TourGuideApplicationPage from './components/pages/TourGuideApplicationPage';
import AdminDashboard from './components/pages/AdminDashboard';
import CancellationPolicy from './components/pages/CancellationPolicy';
import ServiceDurationPolicy from './components/pages/ServiceDurationPolicy';



// Other Components
import Header from './components/layout/Header';
import TourDetails from './components/TourDetails';
import TicketsQuantity from './components/TicketsQuantity';
import CheckoutProcess from './components/CheckoutProcess';
import WishlistNotification from './components/WishlistNotification';
import CartNotification from './components/CartNotification';
import Footer from './components/layout/Footer';
import type { Tour } from './hooks/useTourDetails';

// Inner App component that uses currency and favorites context
function AppContent() {
  const {
    currentView,
    selectedTourSlug,
    navigateToHome,
    navigateToTourDetails,
    navigateToTickets,
    navigateToCheckout,
    navigateToTourGuideApplication,
    navigateToCancellationPolicy,
    navigateToServiceDurationPolicy,
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

  // Render Tour Guide Application page
  if (currentView === 'tour-guide-application') {
    return (
      <TourGuideApplicationPage 
        onBackToHome={navigateToHome}
      />
    );
  }

  // Render Admin Dashboard (hidden route)
  if (currentView === 'admin-dashboard') {
    return (
      <AdminDashboard 
        onBackToHome={navigateToHome}
      />
    );
  }

  // Render Cancellation Policy page
  if (currentView === 'cancellation-policy') {
    return (
      <div className="min-h-screen bg-background">
        <CancellationPolicy />
      </div>
    );
  }


  if (currentView === 'service-duration-policy') {
    return (
      <div className="min-h-screen bg-background">
        <ServiceDurationPolicy />
      </div>
    );
  }




  // Render Homepage
  return (
    <>
    <HomePage
      tours={tours}
      loading={loading}
      error={error}
      onViewTourDetails={handleViewTourDetails}
      onBookNow={handleBookNow}
      onViewTourById={handleViewTourById}
      onPayNow={navigateToCheckout}
      onApplyTourGuide={navigateToTourGuideApplication}
    />
    {/* <Footer
      onViewTourById={handleViewTourById}
      onNavigateToCancellationPolicy={navigateToCancellationPolicy}
    /> */}
    <Footer
      onViewTourById={handleViewTourById}
      onNavigateToCancellationPolicy={navigateToCancellationPolicy}
      onNavigateToServiceDurationPolicy={navigateToServiceDurationPolicy}
    />

  </>
  );
}





// Main App component wrapped with both providers
export default function App() {
  return (
    <CurrencyProvider>
      <WishlistProvider>
        <CartProvider>
          <SuccessCleanup />
          <AppContent />
        </CartProvider>
      </WishlistProvider>
    </CurrencyProvider>
  );
}