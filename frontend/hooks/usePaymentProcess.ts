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

      console.log('💳 Processing XPay payment:', paymentData);

      // ⚠️ تغيير الـ endpoint لـ XPay
      const response = await fetch(`${API_PREFIX}/xpay/pay`, {
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

      // ✅ Handle XPay response
      if (data.iframe_url && data.transaction_uuid) {
        console.log('✅ XPay payment initiated:', {
          iframe_url: data.iframe_url,
          transaction_uuid: data.transaction_uuid
        });

        // 🔑 CRITICAL: Save transaction_uuid to localStorage BEFORE opening iframe
        localStorage.setItem('transaction_uuid', data.transaction_uuid);
        console.log('💾 Saved transaction_uuid to localStorage:', data.transaction_uuid);

        // Redirect to XPay payment iframe
        window.location.href = data.iframe_url;
        
        return { 
          success: true, 
          bookingId: data.order_id || data.transaction_uuid,
          transactionId: data.transaction_uuid
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