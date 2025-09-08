import React from 'react';
import Header from '../layout/Header';
import HeroSection from '../layout/HeroSection';
import ToursGrid from '../tours/ToursGrid';
import BecomeTourGuide from '../sections/BecomeTourGuide';
import TrustSection from '../sections/TrustSection';
import Footer from '../layout/Footer';
import WishlistNotification from '../WishlistNotification';
import { useWishlist } from '../WishlistContext';
import type { Tour } from '../../hooks/useTourDetails';

interface HomePageProps {
  tours: Tour[];
  loading: boolean;
  error: string;
  onViewTourDetails: (tour: Tour) => void;
  onBookNow: (tour: Tour) => void;
  onViewTourById: (tourId: number) => void;
  onPayNow: () => void; // ✅ 
}

export default function HomePage({
  tours,
  loading,
  error,
  onViewTourDetails,
  onBookNow,
  onViewTourById,
  onPayNow, // ✅ 
}: HomePageProps) {
  const { notificationTour, showNotification, hideNotification } = useWishlist();

  // Scroll to tours section - used by hero button
  const handleExploreTours = () => {
    const toursSection = document.getElementById('tours');
    if (toursSection) {
      toursSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onViewTourDetails={onViewTourDetails}
        onBookNow={onBookNow}
        onPayNow={onPayNow}   // ✅ Header → CartSidebar
      />

      <HeroSection onExploreTours={handleExploreTours} />

      <ToursGrid
        tours={tours}
        loading={loading}
        error={error}
        onViewTourDetails={onViewTourDetails}
      />

      <BecomeTourGuide />
      <TrustSection />
      <Footer onViewTourById={onViewTourById} />

      {/* Notification */}
      <WishlistNotification
        tour={notificationTour}
        isVisible={showNotification}
        onClose={hideNotification}
      />
    </div>
  );
}
