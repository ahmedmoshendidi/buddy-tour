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
      // Prepare payment data for XPay
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

      console.log('💳 Processing Paymob payment:', paymentData);

      const response = await fetch(`${API_PREFIX}/pay`, {
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

      // ✅ Handle Paymob response
      if (data.iframe_url && data.order_id) {
        console.log('✅ Paymob payment initiated:', {
          iframe_url: data.iframe_url,
          order_id: data.order_id
        });

        // 🔑 CRITICAL: Save order_id to localStorage BEFORE opening iframe
        localStorage.setItem('transaction_uuid', data.order_id.toString());
        console.log('💾 Saved order_id to localStorage mapped as transaction_uuid:', data.order_id);

        // Redirect to Paymob payment iframe
        window.location.href = data.iframe_url;
        
        return { 
          success: true, 
          bookingId: data.order_id.toString(),
          transactionId: data.order_id.toString()
        };
      } else {
        throw new Error(data.error || 'Payment initiation failed');
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