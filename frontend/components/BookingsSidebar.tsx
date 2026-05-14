import React, { useState } from 'react';
import { useCart } from './CartContext';
import { useCurrency } from './CurrencyContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { CheckCircle, Calendar, Clock, Users, XCircle, AlertTriangle, Loader2, Info } from 'lucide-react';
import { API_PREFIX } from '../config';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface BookingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingsSidebar({ isOpen, onClose }: BookingsSidebarProps) {
  const { paidTours, removeBookedTour } = useCart();
  const { formatPrice } = useCurrency();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => void;
    isError?: boolean;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "OK",
    onConfirm: () => {},
  });

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
      setDialogState({
        isOpen: true,
        title: "Cannot Cancel",
        description: "This tour has already started or passed and cannot be cancelled for a refund.",
        confirmText: "I Understand",
        onConfirm: () => setDialogState(prev => ({ ...prev, isOpen: false })),
        isError: true
      });
      return;
    }

    setDialogState({
      isOpen: true,
      title: "Cancel Booking?",
      description: `${refundInfo}\n\nAre you sure you want to cancel this booking? This action cannot be undone.`,
      confirmText: "Yes, Cancel Booking",
      onConfirm: () => performCancellation(tour)
    });
  };

  const performCancellation = async (tour: any) => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
    setCancellingId(tour.id);
    
    try {
      const orderId = tour.orderId || localStorage.getItem('transaction_uuid');
      
      console.log('💸 Initiating refund for orderId:', orderId);
      
      const response = await fetch(`${API_PREFIX}/kashier/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: orderId || 'DEMO-ORDER' 
        }),
      });

      const data = await response.json();
      if (data.success) {
        setDialogState({
          isOpen: true,
          title: "Cancellation Successful",
          description: `Tour cancelled successfully! Refund of ${formatPrice(data.refundAmount)} (${data.percentage}%) has been initiated.`,
          confirmText: "Great",
          onConfirm: () => {
            setDialogState(prev => ({ ...prev, isOpen: false }));
            removeBookedTour(tour.id);
          }
        });
      } else {
        throw new Error(data.error || 'Cancellation failed');
      }
    } catch (error: any) {
      console.error('Cancellation error:', error);
      setDialogState({
        isOpen: true,
        title: "Cancellation Failed",
        description: `Failed to cancel tour: ${error.message}. Please contact support for assistance.`,
        confirmText: "OK",
        onConfirm: () => setDialogState(prev => ({ ...prev, isOpen: false })),
        isError: true
      });
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

      <AlertDialog open={dialogState.isOpen} onOpenChange={(open) => setDialogState(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={dialogState.isError ? "text-red-600 flex items-center gap-2" : "text-primary flex items-center gap-2"}>
              {dialogState.isError ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
              {dialogState.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line text-gray-600">
              {dialogState.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {!dialogState.isError && dialogState.confirmText !== "Great" && (
              <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            )}
            <AlertDialogAction 
              onClick={dialogState.onConfirm}
              className={dialogState.isError ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"}
            >
              {dialogState.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
