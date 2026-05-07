import React, { useState } from 'react';
import { useCart } from './CartContext';
import { useCurrency } from './CurrencyContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { CheckCircle, Calendar, Clock, Users, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { API_PREFIX } from '../config';

interface BookingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingsSidebar({ isOpen, onClose }: BookingsSidebarProps) {
  const { paidTours, removeBookedTour } = useCart();
  const { formatPrice } = useCurrency();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancelTour = async (tour: any) => {
    const tourDate = new Date(tour.date);
    const now = new Date();
    const hoursDiff = (tourDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let refundInfo = "";
    if (hoursDiff > 24) {
      refundInfo = "You are eligible for a 100% refund (Full Refund).";
    } else if (hoursDiff > 0) {
      refundInfo = "Since the tour is in less than 24 hours, you are eligible for an 80% refund.";
    } else {
      alert("This tour has already started or passed and cannot be cancelled for a refund.");
      return;
    }

    if (!window.confirm(`${refundInfo}\n\nAre you sure you want to cancel this booking?`)) {
      return;
    }

    setCancellingId(tour.id);
    try {
      // In a real app, you'd find the order_id from the tour object
      // For this demo, we'll use a placeholder or assume the backend can find it by email/tour
      const response = await fetch(`${API_PREFIX}/kashier/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: localStorage.getItem('transaction_uuid') || 'DEMO-ORDER' 
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Tour cancelled successfully! Refund of ${formatPrice(data.refundAmount)} (${data.percentage}%) initiated.`);
        removeBookedTour(tour.id);
      } else {
        throw new Error(data.error || 'Cancellation failed');
      }
    } catch (error: any) {
      console.error('Cancellation error:', error);
      alert('Failed to cancel tour: ' + error.message);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-white">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            My Bookings
          </SheetTitle>
          <SheetDescription>
            View and manage your confirmed tours.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {paidTours.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground opacity-20" />
              </div>
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No bookings yet</h3>
              <p className="text-sm text-muted-foreground">
                Once you complete a payment, your tours will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
              {paidTours.map((tour) => (
                <Card key={tour.id} className="p-4 border-green-100 bg-green-50/30">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-sm text-gray-900">{tour.tourTitle}</h4>
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">
                      Paid
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-primary" />
                      <span>{new Date(tour.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary" />
                      <span>{tour.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-primary" />
                      <span>{tour.adults + tour.children} People</span>
                    </div>
                    <div className="font-bold text-primary">
                      {formatPrice(tour.totalAmount)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs text-red-600 border-red-100 hover:bg-red-50"
                      onClick={() => handleCancelTour(tour)}
                      disabled={cancellingId === tour.id}
                    >
                      {cancellingId === tour.id ? (
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-2" />
                      )}
                      Cancel Tour
                    </Button>
                  </div>
                  
                  <p className="mt-3 text-[10px] text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-orange-400" />
                    Refund policy: 100% (&gt;24h), 80% (&lt;24h)
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
