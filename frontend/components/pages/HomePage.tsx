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
import { Helmet } from "react-helmet-async";

interface HomePageProps {
  tours: Tour[];
  loading: boolean;
  error: string;
  onViewTourDetails: (tour: Tour) => void;
  onBookNow: (tour: Tour) => void;
  onViewTourById: (tourId: number) => void;
  onPayNow: () => void;
  onApplyTourGuide: () => void;
}

export default function HomePage({
  tours,
  loading,
  error,
  onViewTourDetails,
  onBookNow,
  onViewTourById,
  onPayNow,
  onApplyTourGuide,
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
      <Helmet>
        <title>BuddyTour — Alexandria Walking Tours with Local Guides</title>
        <meta
          name="description"
          content="Discover and book Alexandria walking tours with trusted local guides. Small groups, fair prices, instant booking."
        />
        <link rel="canonical" href="https://buddytourguide.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="BuddyTour" />
        <meta property="og:title" content="BuddyTour — Alexandria Walking Tours" />
        <meta property="og:description" content="Book Alexandria walking tours with trusted local guides." />
        <meta property="og:url" content="https://buddytourguide.com/" />
        <meta property="og:image" content="https://buddytourguide.com/images/bibliotheca-alexandrina.webp" />
        <meta name="twitter:card" content="summary_large_image" />
     </Helmet>
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

      <BecomeTourGuide onApplyClick={onApplyTourGuide} />
      <TrustSection />
      {/* <Footer onViewTourById={onViewTourById} />
      <Footer 
        onViewTourById={onViewTourById} 
        onNavigateToCancellationPolicy={() => { window.location.href = '/CancellationPolicy'; }}
      /> */}


      {/* Notification */}
      <WishlistNotification
        tour={notificationTour}
        isVisible={showNotification}
        onClose={hideNotification}
      />
    </div>
  );
}
