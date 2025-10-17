import React from 'react';
import { Routes, Route } from 'react-router-dom';

import SuccessCleanup from './components/SuccessCleanup';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import WishlistNotification from './components/WishlistNotification';
import CartNotification from './components/CartNotification';

import HomePage from './components/pages/HomePage';
import TourGuideApplicationPage from './components/pages/TourGuideApplicationPage';
import AdminDashboard from './components/pages/AdminDashboard';
import CancellationPolicy from './components/pages/CancellationPolicy';
import ServiceDurationPolicy from './components/pages/ServiceDurationPolicy';
import PaymentResultPage from './components/pages/PaymentResultPage';
import TourDetails from './components/TourDetails';
import TicketsQuantity from './components/TicketsQuantity';
import CheckoutProcess from './components/CheckoutProcess';

import { useTours } from './hooks/useTours';
import { useWishlist } from './components/WishlistContext';
import { useCart } from './components/CartContext';

export default function App() {
  const { tours, loading, error } = useTours();
  const { notificationTour, showNotification, hideNotification } = useWishlist();
  const {
    notificationTour: cartNotificationTour,
    showNotification: showCartNotification,
    hideNotification: hideCartNotification,
  } = useCart();

  return (
    <>
      <SuccessCleanup />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-grow">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  tours={tours}
                  loading={loading}
                  error={error}
                  onViewTourDetails={() => {}}
                  onBookNow={() => {}}
                  onViewTourById={() => {}}
                  onPayNow={() => {}}
                  onApplyTourGuide={() => {}}
                />
              }
            />
            <Route path="/tour/:slug" element={<TourDetails />} />
            <Route path="/tickets/:slug" element={<TicketsQuantity />} />
            <Route path="/checkout" element={<CheckoutProcess />} />
            <Route path="/cancellation-policy" element={<CancellationPolicy />} />
            <Route path="/service-duration-policy" element={<ServiceDurationPolicy />} />
            <Route path="/tour-guide-application" element={<TourGuideApplicationPage />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/payment-success" element={<PaymentResultPage isSuccess={true} />} />
            <Route path="/payment-failure" element={<PaymentResultPage isSuccess={false} />} />
          </Routes>
        </main>

        <Footer />
      </div>

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
    </>
  );
}
