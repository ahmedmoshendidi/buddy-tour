import { useState } from 'react';
import { API_PREFIX } from '../config';
import { FormData } from './useCheckoutForm';

interface PaymentResult {
  success: boolean;
  error?: string;
  bookingId?: string;
}

export function usePaymentProcess() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  const processPayment = async (formData: FormData): Promise<PaymentResult> => {
    setIsProcessing(true);
    setPaymentResult(null);

    try {
      // Prepare booking data
      const bookingData = {
        tour_id: formData.tour_id,
        date: formData.date,
        time: formData.time,
        adults: formData.adults || 0,
        children: formData.children || 0,
        total_amount: formData.total_amount,
        price_per_person: formData.price_per_person,
        customer_name: `${formData.firstName} ${formData.lastName}`.trim(),
        customer_email: formData.email,
        customer_phone: formData.phone,
        customer_nationality: formData.nationality,
        payment_method: formData.paymentMethod,
        special_requests: formData.special_requests || ''
      };

      console.log('Processing booking with data:', bookingData);

      const response = await fetch(`${API_PREFIX}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle different response types based on payment method
      if (formData.paymentMethod === 'card' && data.payment_url) {
        // Redirect to payment gateway
        window.location.href = data.payment_url;
        return { success: true, bookingId: data.booking_id };
      } else if (formData.paymentMethod === 'wallet' && data.payment_url) {
        // Redirect to wallet payment
        window.location.href = data.payment_url;
        return { success: true, bookingId: data.booking_id };
      } else if (data.success) {
        // Direct booking confirmation
        const result = { success: true, bookingId: data.booking_id };
        setPaymentResult(result);
        return result;
      } else {
        throw new Error(data.message || 'Booking failed');
      }

    } catch (error: any) {
      console.error('Payment processing error:', error);
      const result = { 
        success: false, 
        error: error.message || 'Payment processing failed. Please try again.' 
      };
      setPaymentResult(result);
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  const resetPaymentState = () => {
    setPaymentResult(null);
    setIsProcessing(false);
  };

  return {
    isProcessing,
    paymentResult,
    processPayment,
    resetPaymentState
  };
}