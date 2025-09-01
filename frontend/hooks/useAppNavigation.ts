import { useState, useEffect } from 'react';

export type AppView = 'home' | 'tour-details' | 'tickets' | 'checkout' | 'payment-success' | 'payment-failure';

export function useAppNavigation() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedTourSlug, setSelectedTourSlug] = useState<string | null>(null);

  // Handle URL routing and payment result on app load
  useEffect(() => {
    const path = window.location.pathname;
    const q = new URLSearchParams(window.location.search);

    // Check for payment results first
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

    if (isSuccess) {
      setCurrentView('payment-success');
      return;
    }
    if (isFailure) {
      setCurrentView('payment-failure');
      return;
    }

    // Handle URL routing for direct visits
    if (path === '/' || path === '') {
      setCurrentView('home');
    } else if (path.startsWith('/tour/')) {
      // Extract tour slug from URL: /tour/bibliotheca-alexandrina-tour
      const slug = path.replace('/tour/', '');
      if (slug) {
        setSelectedTourSlug(slug);
        setCurrentView('tour-details');
      }
    } else if (path.startsWith('/tours/')) {
      // Also handle /tours/ format
      const slug = path.replace('/tours/', '');
      if (slug) {
        setSelectedTourSlug(slug);
        setCurrentView('tour-details');
      }
    } else if (path === '/checkout') {
      setCurrentView('checkout');
    }
  }, []);

  const navigateToHome = () => {
    setCurrentView('home');
    setSelectedTourSlug(null);
    // Update URL to home page
    window.history.pushState({}, document.title, '/');
  };

  const navigateToTourDetails = (tourSlug: string) => {
    setSelectedTourSlug(tourSlug);
    setCurrentView('tour-details');
    // Update URL to tour details page
    window.history.pushState({}, document.title, `/tour/${tourSlug}`);
  };

  const navigateToTickets = (tourSlug: string) => {
    setSelectedTourSlug(tourSlug);
    setCurrentView('tickets');
    // Keep same URL as tour details for now
    window.history.pushState({}, document.title, `/tour/${tourSlug}`);
  };

  const navigateToCheckout = () => {
    setCurrentView('checkout');
    // Update URL to checkout
    window.history.pushState({}, document.title, '/checkout');
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