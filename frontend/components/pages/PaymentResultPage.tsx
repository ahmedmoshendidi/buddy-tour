import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../layout/Header';
import PaymentSuccess from '../PaymentSuccess';
import PaymentFailure from '../PaymentFailure';
import WishlistNotification from '../WishlistNotification';
import { useWishlist } from '../WishlistContext';

export default function PaymentResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notificationTour, showNotification, hideNotification } = useWishlist();

  // ✅ نقرأ من الـ URL لو الحالة success أو failed
  const params = new URLSearchParams(location.search);
  const successParam = params.get('success') || params.get('status');
  const isSuccess =
    successParam === 'true' ||
    successParam === 'success' ||
    successParam === 'completed';

  return (
    <div className="min-h-screen bg-background">

      {/* محتوى الصفحة */}
      {isSuccess ? (
        <PaymentSuccess onBackToHome={() => navigate('/')} />
      ) : (
        <PaymentFailure
          onBackToHome={() => navigate('/')}
          onRetryPayment={() => navigate('/checkout')}
        />
      )}

      {/* إشعارات الـ Wishlist */}
      <WishlistNotification
        tour={notificationTour}
        isVisible={showNotification}
        onClose={hideNotification}
      />
    </div>
  );
}
