import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../layout/Header';
import PaymentSuccess from '../PaymentSuccess';
import PaymentFailure from '../PaymentFailure';
import WishlistNotification from '../WishlistNotification';
import { useWishlist } from '../WishlistContext';

interface PaymentResultPageProps {
  isSuccess: boolean;
}

export default function PaymentResultPage({ isSuccess }: PaymentResultPageProps) {
  const navigate = useNavigate();
  const { notificationTour, showNotification, hideNotification } = useWishlist();

  return (
    <div className="min-h-screen bg-background">
      {/* Header بدون props — بيستخدم <Link> جوه */}
      <Header />

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
