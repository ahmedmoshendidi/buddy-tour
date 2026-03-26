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

      console.log('💳 Processing Paysky payment:', paymentData);

      // We use /paysky/pay for the new gateway "try"
      const response = await fetch(`${API_PREFIX}/paysky/pay`, {
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

      // ✅ Handle Paysky response
      if (data.SecureHash) {
        console.log('✅ Paysky payment initiated:', data);

        return new Promise((resolve) => {
          const Lightbox = (window as any).Lightbox;
          if (!Lightbox) {
            resolve({ success: false, error: 'Paysky Lightbox not loaded' });
            return;
          }

          Lightbox.Checkout.configure = {
            MID: data.MID,
            TID: data.TID,
            AmountTrxn: data.AmountTrxn,
            SecureHash: data.SecureHash,
            MerchantReference: data.MerchantReference,
            TrxDateTime: data.TrxDateTime,
            // Wallet requires MobileNumber (usually with country code like 201xxxxxxxxx)
            MobileNumber: data.CustomerMobile ? (data.CustomerMobile.startsWith('2') ? data.CustomerMobile : '2' + data.CustomerMobile) : '',
            CustomerEmail: data.CustomerEmail || '',
            completeCallback: function (res: any) {
              console.log('✅ Paysky completed:', res);
              localStorage.setItem('transaction_uuid', data.MerchantReference);
              resolve({ 
                success: true, 
                bookingId: data.MerchantReference,
                transactionId: data.MerchantReference
              });
              // Force redirect to success page
              window.location.href = `/payment-result?success=true&order_id=${data.MerchantReference}`;
            },
            errorCallback: function (error: any) {
              console.error('❌ Paysky error:', error);
              resolve({ success: false, error: error });
            },
            cancelCallback: function () {
              console.log('🛑 Paysky canceled');
              resolve({ success: false, error: 'Payment canceled by user' });
            }
          };

          Lightbox.Checkout.showLightbox();
        });
      } else {
        throw new Error(data.error || 'Paysky initiation failed');
      }

      /* 
      // Original Paymob Logic (kept for reference)
      if (data.iframe_url && data.order_id) {
        localStorage.setItem('transaction_uuid', data.order_id.toString());
        window.location.href = data.iframe_url;
        return { success: true, bookingId: data.order_id.toString() };
      } 
      */

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