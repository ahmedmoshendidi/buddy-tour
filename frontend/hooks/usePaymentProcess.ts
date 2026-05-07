import { useState } from 'react';
import { API_PREFIX } from '../config';
import { FormData } from './useCheckoutForm';

interface PaymentResult {
  success: boolean;
  error?: string;
  bookingId?: string;
  transactionId?: string;
}

export function usePaymentProcess() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  const processPayment = async (formData: FormData): Promise<PaymentResult> => {
    setIsProcessing(true);
    setPaymentResult(null);

    try {
      const paymentData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        nationality: formData.nationality,
        tour_id: formData.tour_id,
        date: formData.date,
        time: formData.time,
        adults: formData.adults || 0,
        children: formData.children || 0,
        session_id: formData.session_id,
      };

      console.log('💳 Processing Kashier payment:', paymentData);

      const response = await fetch(`${API_PREFIX}/kashier/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // ✅ Handle Kashier response
      if (data.iframe_url && data.transaction_uuid) {
        console.log('✅ Kashier payment initiated:', data);
        localStorage.setItem('transaction_uuid', data.transaction_uuid.toString());
        
        // Redirect to Kashier payment page
        window.location.href = data.iframe_url;
        
        return { 
          success: true, 
          bookingId: data.transaction_uuid.toString(),
          transactionId: data.transaction_uuid.toString()
        };
      } else {
        throw new Error(data.error || 'Kashier initiation failed: missing iframe_url or transaction_uuid');
      }

    } catch (error: any) {
      console.error('❌ Payment processing error:', error);
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