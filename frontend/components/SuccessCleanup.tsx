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
    const statusParam = params.get('success') || params.get('status') || params.get('transaction_status') || params.get('paymentStatus') || params.get('payment_status');
    const isSuccess =
      statusParam === 'true' ||
      statusParam === 'success' ||
      statusParam === 'SUCCESSFUL' ||
      statusParam === 'SUCCESS' ||
      statusParam === 'completed' ||
      params.get('completed') === 'true';

    console.log('🔍 SuccessCleanup: Detected status =', statusParam, '| isSuccess =', isSuccess);

    if (!isSuccess) return;

    try {
      // Try to get sessionId from paid_booking first (for post-payment cleanup)
      const paidBookingRaw = localStorage.getItem('paid_booking');
      const paidBooking = paidBookingRaw ? JSON.parse(paidBookingRaw) : null;

      // Fallback to bookingData if paid_booking doesn't exist (immediate after payment)
      const bookingDataRaw = localStorage.getItem('bookingData');
      const bookingData = bookingDataRaw ? JSON.parse(bookingDataRaw) : null;

      const orderId = params.get('merchantOrderId') || params.get('orderId');
      const sessionId: string | undefined = paidBooking?.session_id || bookingData?.session_id;
      const tourId: number | undefined = bookingData?.tour_id;

      console.log('🧹 SuccessCleanup Trace:', { 
        orderId,
        sessionId, 
        tourId, 
        hasPaidBooking: !!paidBooking, 
        hasBookingData: !!bookingData
      });

      // 1) اول حاجة ، اعمل mark للتور كـ paid عشان العداد يختفي فورا
      if (orderId || sessionId || tourId) {
        console.log(`✨ SuccessCleanup: Marking as paid | OrderId: ${orderId} | Session: ${sessionId} | TourId: ${tourId}`);
        markTourAsPaid(sessionId || '', orderId || undefined, tourId);

        // ✅ Persist paid status for CartContext recovery on refresh
        localStorage.setItem('paid_booking', JSON.stringify({
          session_id: sessionId,
          order_id: orderId,
          tour_id: tourId,
          total_amount: bookingData?.total_amount || 0,
          timestamp: new Date().toISOString()
        }));

        // Meta Pixel Purchase Event
        if (typeof window !== 'undefined' && (window as any).fbq) {
          const purchaseTrackingKey = `fbq_purchase_${sessionId || tourId}`;
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

        // 2) Keep the tour in the list but mark as paid (it will show in BookingsSidebar now)
        console.log('✅ SuccessCleanup: Tour transition initiated');
      }

      // DON'T remove bookingData immediately - let it stay for redundancy
      // Clean up only very old data if needed (optional)

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
