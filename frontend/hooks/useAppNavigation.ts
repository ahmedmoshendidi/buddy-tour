import { useState, useEffect } from 'react';

export type AppView = 'home' | 'tour-details' | 'tickets' | 'checkout' | 'payment-success' | 'payment-failure';

export function useAppNavigation() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedTourSlug, setSelectedTourSlug] = useState<string | null>(null);

  // Check for payment result in URL on app load
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);

    const status = q.get('payment_status') || q.get('status');
    const success = q.get('success');
    const error = q.get('error_occured');
    const code = q.get('txn_response_code');
    const pending = q.get('pending');

    const isSuccess =
      success === 'true' ||
      status === 'success' ||
      status === 'completed' ||
      (error === 'false' && code === 'APPROVED');

    const isFailure =
      success === 'false' ||
      status === 'failed' ||
      status === 'error' ||
      error === 'true' ||
      pending === 'true';

    if (isSuccess) setCurrentView('payment-success');
    else if (isFailure) setCurrentView('payment-failure');
  }, []);

  const navigateToHome = () => {
    setCurrentView('home');
    setSelectedTourSlug(null);
    // Clear URL parameters when going back to home
    window.history.pushState({}, document.title, window.location.pathname);
  };

  const navigateToTourDetails = (tourSlug: string) => {
    setSelectedTourSlug(tourSlug);
    setCurrentView('tour-details');
  };

  const navigateToTickets = (tourSlug: string) => {
    setSelectedTourSlug(tourSlug);
    setCurrentView('tickets');
  };

  const navigateToCheckout = () => {
    setCurrentView('checkout');
  };

  const navigateToPaymentSuccess = () => {
    setCurrentView('payment-success');
  };

  const navigateToPaymentFailure = () => {
    setCurrentView('payment-failure');
  };

  return {
    currentView,
    selectedTourSlug,
    navigateToHome,
    navigateToTourDetails,
    navigateToTickets,
    navigateToCheckout,
    navigateToPaymentSuccess,
    navigateToPaymentFailure
  };
}