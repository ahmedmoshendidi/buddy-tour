import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';

export default function SuccessCleanup() {
  const navigate = useNavigate();
  const { removeBookedTourBySession, markTourAsPaid } = useCart();
  // لتفادي تشغيل الـ effect مرتين في React Strict Mode أثناء التطوير
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const status = params.get('success') || params.get('status') || params.get('transaction_status');
    const isSuccess =
      status === 'true' ||
      status === 'success' ||
      status === 'SUCCESSFUL' ||
      status === 'SUCCESS' ||
      status === 'completed';

    if (!isSuccess) return;

    try {
      // Try to get sessionId from paid_booking first (for post-payment cleanup)
      const paidBookingRaw = localStorage.getItem('paid_booking');
      const paidBooking = paidBookingRaw ? JSON.parse(paidBookingRaw) : null;
      
      // Fallback to bookingData if paid_booking doesn't exist (immediate after payment)
      const bookingDataRaw = localStorage.getItem('bookingData');
      const bookingData = bookingDataRaw ? JSON.parse(bookingDataRaw) : null;
      
      const sessionId: string | undefined = paidBooking?.session_id || bookingData?.session_id;
      const tourId: number | undefined = bookingData?.tour_id;

      console.log('🧹 SuccessCleanup: sessionId =', sessionId, 'from', paidBooking ? 'paid_booking' : 'bookingData');

      // 1) اول حاجة ، اعمل mark للتور كـ paid عشان العداد يختفي فورا
      if (sessionId) {
        markTourAsPaid(sessionId);
        
        // Meta Pixel Purchase Event
        if (typeof window !== 'undefined' && (window as any).fbq) {
          const purchaseTrackingKey = `fbq_purchase_${sessionId}`;
          if (!localStorage.getItem(purchaseTrackingKey)) {
            (window as any).fbq('track', 'Purchase', {
              content_type: 'product',
              content_ids: [tourId],
              value: paidBooking?.total_amount || bookingData?.total_amount || 0,
              currency: 'USD'
            });
            localStorage.setItem(purchaseTrackingKey, 'true');
            console.log('✅ Meta Pixel Purchase Logged');
          }
        }
        
        // 2) استناه شوية عشان اليوزر يشوف انه paid، بعدين امسحه من الكارت
        setTimeout(() => {
          console.log('🗑️ SuccessCleanup: Removing tour with sessionId:', sessionId);
          removeBookedTourBySession(sessionId);
          
          // Clean up paid_booking after removal
          localStorage.removeItem('paid_booking');
        }, 3000); // 3 seconds to show paid status
      }

      // Clean up bookingData if it exists
      if (bookingDataRaw) {
        localStorage.removeItem('bookingData');
      }

      // 3) امسح مفتاح السيشن الخاص بالتور لو بيطابق نفس السيشن
      if (tourId && sessionId) {
        const key = `buddy_tour_session_${tourId}`;
        if (localStorage.getItem(key) === sessionId) {
          localStorage.removeItem(key);
        }
      }

      // 4) نظّف الـ URL من باراميترات النجاح (إلا لو في صفحة النتيجة عشان الصفحة محتجاهم)
      if (window.location.pathname !== '/payment-result') {
        params.delete('success');
        params.delete('status');
        const newQuery = params.toString();
        const cleanUrl =
          window.location.pathname + (newQuery ? `?${newQuery}` : '');
        navigate(cleanUrl, { replace: true });
      }
    } catch (err) {
      console.error('SuccessCleanup error:', err);
    }
  }, [removeBookedTourBySession, markTourAsPaid]);

  return null;
}
