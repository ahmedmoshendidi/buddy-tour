import React from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';

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
import PrivacyAndTermsPage from './components/pages/PrivacyAndTermsPage';

import PaymentResultPage from './components/pages/PaymentResultPage';
import TourDetails from './components/TourDetails';
import TicketsQuantity from './components/TicketsQuantity';
import CheckoutProcess from './components/CheckoutProcess';

import { useTours } from './hooks/useTours';
import { useWishlist } from './components/WishlistContext';
import { useCart } from './components/CartContext';

// ✅ Layouts
import MainLayout from './components/layout/MainLayout';
import MinimalLayout from './components/layout/MinimalLayout';

function TicketsQuantityWrapper() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const handleBack = () => navigate('/');
  const handleCheckout = (bookingInfo: any) => {
    navigate(`/checkout/${slug}`, { state: { bookingInfo } });
  };

  return (
    <TicketsQuantity
      tourId={slug || ''}
      onBack={handleBack}
      onCheckout={handleCheckout}
    />
  );
}

export default function App() {
  const navigate = useNavigate();
  const { tours, loading, error } = useTours();
  const { notificationTour, showNotification, hideNotification } = useWishlist();
  const {
    notificationTour: cartNotificationTour,
    showNotification: showCartNotification,
    hideNotification: hideCartNotification,
  } = useCart();

  // ✅ دالة التقديم كـ مرشد سياحي
  const handleApplyTourGuide = () => {
    navigate('/tour-guide-application');
  };

  return (
    <>
      <SuccessCleanup />

      <Routes>
        {/* ✅ الصفحات اللي فيها Header/Footer */}
        <Route element={<MainLayout />}>
          <Route
            path="/"
            element={
              <HomePage
                tours={tours}
                loading={loading}
                error={error}
                onViewTourDetails={(tour) => navigate(`/tour/${tour.slug}`)}
                onBookNow={() => {}}
                onViewTourById={() => {}}
                onPayNow={() => {}}
                onApplyTourGuide={handleApplyTourGuide} // ✅ تم الربط هنا
              />
            }
          />
          <Route path="/tour/:slug" element={<TourDetails />} />
          <Route path="/tickets/:slug" element={<TicketsQuantityWrapper />} />
          <Route path="/checkout/:slug" element={<CheckoutProcess />} />
          <Route path="/tour-guide-application" element={<TourGuideApplicationPage />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>

        {/* ✅ صفحات بدون Header/Footer */}
        <Route element={<MinimalLayout />}>
          <Route path="/cancellation-policy" element={<CancellationPolicy />} />
          <Route path="/service-duration-policy" element={<ServiceDurationPolicy />} />
          <Route path="/payment-result" element={<PaymentResultPage />} />
          <Route path="/privacy-policy" element={<PrivacyAndTermsPage />} />
          <Route path="/terms-and-conditions" element={<PrivacyAndTermsPage />} />
        </Route>
      </Routes>

      {/* ✅ الإشعارات */}
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
