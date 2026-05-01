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
  const successParam = params.get('success') || params.get('status') || params.get('transaction_status');
  const hasOrderId = params.get('orderId') || params.get('order_id') || params.get('uuid') || params.get('id');

  const urlIsSuccess =
    successParam === 'true' ||
    successParam === 'success' ||
    successParam === 'completed' ||
    successParam === 'SUCCESSFUL' ||
    successParam === 'SUCCESS' ||
    hasOrderId !== null;

  // ✅ Persist success state in sessionStorage to handle refreshes after URL cleanup
  const [isSuccess, setIsSuccess] = React.useState(() => {
    const savedSuccess = sessionStorage.getItem('last_payment_success');
    return urlIsSuccess || savedSuccess === 'true';
  });

  React.useEffect(() => {
    if (urlIsSuccess) {
      sessionStorage.setItem('last_payment_success', 'true');
      setIsSuccess(true);
    }
  }, [urlIsSuccess]);

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
