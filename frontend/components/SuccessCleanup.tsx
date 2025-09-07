import { useEffect, useRef } from 'react';
import { useCart } from './CartContext';

export default function SuccessCleanup() {
  const { removeBookedTourBySession } = useCart();
  // لتفادي تشغيل الـ effect مرتين في React Strict Mode أثناء التطوير
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const isSuccess =
      params.get('success') === 'true' ||
      params.get('status') === 'success';

    if (!isSuccess) return;

    try {
      const raw = localStorage.getItem('bookingData');
      const data = raw ? JSON.parse(raw) : null;

      const sessionId: string | undefined = data?.session_id; // من bookingData (snake_case)
      const tourId: number | undefined = data?.tour_id;

      // 1) امسح العنصر المدفوع فقط من السلة
      if (sessionId) {
        removeBookedTourBySession(sessionId);
      }

      // 2) امسح بيانات الشيك آوت
      localStorage.removeItem('bookingData');

      // 3) امسح مفتاح السيشن الخاص بالتور لو بيطابق نفس السيشن
      if (tourId && sessionId) {
        const key = `buddy_tour_session_${tourId}`;
        if (localStorage.getItem(key) === sessionId) {
          localStorage.removeItem(key);
        }
      }

      // 4) نظّف الـ URL من باراميترات النجاح
      params.delete('success');
      params.delete('status');
      const newQuery = params.toString();
      const cleanUrl =
        window.location.pathname + (newQuery ? `?${newQuery}` : '');
      window.history.replaceState({}, '', cleanUrl);
    } catch (err) {
      console.error('SuccessCleanup error:', err);
    }
  }, [removeBookedTourBySession]);

  return null;
}
