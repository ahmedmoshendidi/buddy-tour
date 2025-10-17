import React from 'react';
import Header from '../layout/Header';
import HeroSection from '../layout/HeroSection';
import ToursGrid from '../tours/ToursGrid';
import BecomeTourGuide from '../sections/BecomeTourGuide';
import TrustSection from '../sections/TrustSection';
import Footer from '../layout/Footer';
import { useNavigate } from "react-router-dom";
import WishlistNotification from '../WishlistNotification';
import { useWishlist } from '../WishlistContext';
import type { Tour } from '../../hooks/useTourDetails';
import { Helmet } from "react-helmet-async";

interface HomePageProps {
  tours: Tour[];
  loading: boolean;
  error: string;
  onViewTourDetails: (tour: Tour) => void;        // ← أضف هذا السطر
  onBookNow: (tour: Tour) => void;
  onViewTourById: (tourId: number) => void;
  onPayNow: () => void;
  onApplyTourGuide: () => void;
}

export default function HomePage({
  tours,
  loading,
  error,
  onViewTourDetails,   // ← الآن TypeScript سيعرف هذه الخاصية
  onBookNow,
  onViewTourById,
  onPayNow,
  onApplyTourGuide,
}: HomePageProps) {
  const { notificationTour, showNotification, hideNotification } = useWishlist();
  const navigate = useNavigate();

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
      <Helmet>
        <title>BuddyTour — Alexandria Walking Tours with Local Guides</title>
        {/* ...meta ... */}
      </Helmet>

      {/* <Header/> */}

      <HeroSection onExploreTours={handleExploreTours} />

      <ToursGrid
        tours={tours}
        loading={loading}
        error={error}
        onViewTourDetails={onViewTourDetails} // يُمرّر callback من App.tsx
      />

      <BecomeTourGuide onApplyClick={onApplyTourGuide} />
      <TrustSection />

      {/* Notification */}
      <WishlistNotification
        tour={notificationTour}
        isVisible={showNotification}
        onClose={hideNotification}
      />
    </div>
  );
}
