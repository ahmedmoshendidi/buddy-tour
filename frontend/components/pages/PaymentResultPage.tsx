import React from 'react';
import Header from '../layout/Header';
import PaymentSuccess from '../PaymentSuccess';
import PaymentFailure from '../PaymentFailure';
import WishlistNotification from '../WishlistNotification';
import { useWishlist } from '../WishlistContext';
import type { Tour } from '../../hooks/useTourDetails';

interface PaymentResultPageProps {
  isSuccess: boolean;
  onBackToHome: () => void;
  onRetryPayment?: () => void;
  onViewTourDetails: (tour: Tour) => void;
  onBookNow: (tour: Tour) => void;
}

export default function PaymentResultPage({
  isSuccess,
  onBackToHome,
  onRetryPayment,
  onViewTourDetails,
  onBookNow
}: PaymentResultPageProps) {
  const { notificationTour, showNotification, hideNotification } = useWishlist();

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onViewTourDetails={onViewTourDetails} 
        onBookNow={onBookNow}
      />
      
      {isSuccess ? (
        <PaymentSuccess onBackToHome={onBackToHome} />
      ) : (
        <PaymentFailure 
          onBackToHome={onBackToHome}
          onRetryPayment={onRetryPayment || (() => {})}
        />
      )}

      {/* Notification */}
      <WishlistNotification 
        tour={notificationTour}
        isVisible={showNotification}
        onClose={hideNotification}
      />
    </div>
  );
}