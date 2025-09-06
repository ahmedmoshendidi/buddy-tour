import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useCheckoutForm } from '../hooks/useCheckoutForm';
import { usePaymentProcess } from '../hooks/usePaymentProcess';
import CountdownTimer from './ui/CountdownTimer';
import { useCart } from './CartContext';

// Step Components
import CheckoutSteps from './checkout/CheckoutSteps';
import ContactInformationStep from './checkout/ContactInformationStep';
import PaymentMethodStep from './checkout/PaymentMethodStep';
import ConfirmationStep from './checkout/ConfirmationStep';
import BookingSummary from './checkout/BookingSummary';

interface CheckoutProcessProps {
  onBack: () => void;
}

const steps = [
  {
    id: 1,
    title: 'Contact Information',
    description: 'Your personal details'
  },
  {
    id: 2,
    title: 'Payment Method',
    description: 'Complete payment'
  },
  {
    id: 3,
    title: 'Confirmation',
    description: 'Booking complete!'
  }
];

export default function CheckoutProcess({ onBack }: CheckoutProcessProps) {
  const {
    currentStep,
    formData,
    errors,
    updateFormData,
    nextStep,
    prevStep
  } = useCheckoutForm();

  const { isProcessing, paymentResult, processPayment } = usePaymentProcess();
  const { bookedTours } = useCart();
  const [holdExpiration, setHoldExpiration] = useState<Date | null>(null);

  // ✅ Merge bookingData (includes session_id) from localStorage into formData
  useEffect(() => {
    const raw = localStorage.getItem('bookingData');
    if (!raw) return;

    try {
      const data = JSON.parse(raw);

      // مرّر الحقول المطلوبة واحدة واحدة لأن updateFormData(field, value)
      if (data.tour_id !== undefined) updateFormData('tour_id', data.tour_id);
      if (data.date !== undefined) updateFormData('date', data.date);
      if (data.time !== undefined) updateFormData('time', data.time);
      if (data.adults !== undefined) updateFormData('adults', data.adults);
      if (data.children !== undefined) updateFormData('children', data.children);
      if (data.price_per_person !== undefined) updateFormData('price_per_person', data.price_per_person);
      if (data.total_amount !== undefined) updateFormData('total_amount', data.total_amount);
      if (data.session_id !== undefined) updateFormData('session_id', data.session_id); // ← أهم سطر

      console.log('✅ bookingData merged into formData (includes session_id):', data);
    } catch (e) {
      console.error('Failed to parse bookingData from localStorage:', e);
    }
  }, []); // run once

  // Get hold expiration from booking data - check immediately and on storage events
  useEffect(() => {
    // Function to check for booking data
    const checkBookingData = () => {
      // First try localStorage
      const bookingData = localStorage.getItem('bookingData');
      if (bookingData) {
        try {
          const data = JSON.parse(bookingData);
          if (data.hold_expires_at) {
            setHoldExpiration(new Date(data.hold_expires_at));
            console.log('✅ Hold expiration loaded from localStorage:', data.hold_expires_at);
            return;
          }
        } catch (error) {
          console.error('Error parsing booking data:', error);
        }
      }

      // Fallback: Check cart for any booked tours with hold expiration
      if (bookedTours.length > 0) {
        const latestBooking = bookedTours[bookedTours.length - 1];
        if (latestBooking.holdExpiresAt) {
          setHoldExpiration(new Date(latestBooking.holdExpiresAt));
          console.log('✅ Hold expiration loaded from cart:', latestBooking.holdExpiresAt);
        }
      }
    };

    // Check immediately
    checkBookingData();

    // Listen for storage events (in case data is set after component mounts)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bookingData') {
        checkBookingData();
      }
    };

    // Also check periodically for the first 2 seconds (fallback for same-tab updates)
    const intervalId = setInterval(() => {
      if (!holdExpiration) {
        checkBookingData();
      }
    }, 100);

    // Clear interval after 2 seconds
    setTimeout(() => clearInterval(intervalId), 2000);

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [holdExpiration, bookedTours]);

  const handleNext = async () => {
    if (currentStep === 2) {
      // Process payment on step 2
      const result = await processPayment(formData);
      if (result.success && !result.bookingId) {
        // Only move to confirmation if payment was processed locally
        // Otherwise, user will be redirected to payment gateway
        nextStep();
      }
    } else {
      nextStep();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      prevStep();
    } else {
      onBack();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ContactInformationStep
            formData={formData}
            errors={errors}
            onUpdateFormData={updateFormData}
          />
        );
      case 2:
        return (
          <PaymentMethodStep
            formData={formData}
            errors={errors}
            onUpdateFormData={updateFormData}
          />
        );
      case 3:
        return (
          <ConfirmationStep
            formData={formData}
            tourTitle="Alexandria Walking Tour"
          />
        );
      default:
        return null;
    }
  };

  const renderActionButtons = () => {
    if (currentStep === 3) {
      return (
        <div className="flex justify-center">
          <Button onClick={onBack} className="px-8">
            Return to Tours
          </Button>
        </div>
      );
    }

    return (
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {currentStep === 1 ? 'Back to Tours' : 'Previous'}
        </Button>

        <Button 
          onClick={handleNext}
          disabled={isProcessing}
          className="flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {currentStep === 2 ? 'Complete Payment' : 'Next'}
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-amber-50/20 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <CheckoutSteps currentStep={currentStep} steps={steps} />
            
            {/* Error Display */}
            {paymentResult?.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Payment Failed</span>
                </div>
                <p className="text-red-600 text-sm mt-1">{paymentResult.error}</p>
              </div>
            )}

            {/* Step Content */}
            {renderStepContent()}

            {/* Action Buttons */}
            <div className="pt-6">
              {renderActionButtons()}
            </div>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Countdown Timer - Above Booking Summary */}
            {holdExpiration && (
              <CountdownTimer
                expirationTime={holdExpiration.toISOString()}
                className="!bg-amber-100 !border-amber-300 !text-amber-900"
                onExpire={() => {
                  setHoldExpiration(null);
                  // Redirect back to tour selection or show expired message
                  alert('Your seat reservation has expired. Please select your seats again.');
                  onBack();
                }}
              />
            )}
            
            <BookingSummary 
              formData={formData}
              tourTitle="Alexandria Walking Tour"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
