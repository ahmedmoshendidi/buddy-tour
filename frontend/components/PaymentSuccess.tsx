import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { useCurrency } from "./CurrencyContext";
import {
  CheckCircle,
  Calendar,
  Home,
  Mail,
  Phone,
  Star,
  Compass,
} from "lucide-react";

interface PaymentSuccessProps {
  onBackToHome: () => void;
}

export default function PaymentSuccess({
  onBackToHome,
}: PaymentSuccessProps) {
  const [transactionId, setTransactionId] =
    useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    // Read URL parameters for transaction details
    const urlParams = new URLSearchParams(
      window.location.search,
    );
    const txId =
      urlParams.get("id") || urlParams.get("transaction_id");
    const amountCents = urlParams.get("amount_cents");
    const amountDirect = urlParams.get("amount");

    if (txId) {
      setTransactionId(txId);
    }

    if (amountCents) {
      // Convert from cents to main currency unit
      setAmount(parseFloat(amountCents) / 100);
    } else if (amountDirect) {
      setAmount(parseFloat(amountDirect));
    }

     const t = setTimeout(() => {
    window.history.replaceState({}, document.title, window.location.pathname);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-amber-50 to-coral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Success Animation Container */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-primary rounded-full animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-teal-500 to-primary rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl mb-4 bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
            Payment Successful! 🎉
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            Your Alexandria adventure is confirmed
          </p>
          <div className="flex items-center justify-center gap-2">
            <Star className="h-5 w-5 text-amber-500 fill-current" />
            <span className="text-amber-600 font-medium">
              Get ready for an authentic Arabic experience
            </span>
            <Star className="h-5 w-5 text-amber-500 fill-current" />
          </div>
        </div>

        {/* Main Success Card */}
        <Card className="border-2 border-teal-200 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Transaction Details */}
            <div className="bg-gradient-to-r from-teal-50 to-amber-50 rounded-lg p-6 mb-6 border border-teal-200">
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Booking Confirmation
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">
                    Transaction ID
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className="font-mono"
                    >
                      {transactionId || "Processing..."}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">
                    Amount Paid
                  </label>
                  <div className="mt-1">
                    <span className="text-xl font-semibold text-primary">
                      {amount > 0
                        ? formatPrice(amount)
                        : "Confirming..."}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Next Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                What Happens Next?
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-amber-50 to-coral-50 rounded-lg border border-amber-200">
                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm font-medium">
                      1
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      Confirmation Email
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You'll receive a detailed booking
                      confirmation within 5 minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-coral-50 to-teal-50 rounded-lg border border-coral-200">
                  <div className="w-6 h-6 bg-coral-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm font-medium">
                      2
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">Guide Contact</p>
                    <p className="text-sm text-muted-foreground">
                      Your local guide will contact you 24 hours
                      before the tour
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-teal-50 to-amber-50 rounded-lg border border-teal-200">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm font-medium">
                      3
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">Tour Day</p>
                    <p className="text-sm text-muted-foreground">
                      Meet your guide at the designated location
                      and start exploring!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Section */}
            <div className="bg-gradient-to-r from-muted/30 to-teal-50/30 rounded-lg p-4 mb-6 border border-border">
              <h4 className="font-medium text-primary mb-2 flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Need Help?
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Our support team is here to assist you with any
                questions about your booking.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white">
                  📧 support@buddytour.com
                </Badge>
                <Badge variant="outline" className="bg-white">
                  📱 +20 102 903 1487
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={onBackToHome}
                className="flex-1 bg-gradient-to-r from-primary to-teal-600 hover:from-teal-700 hover:to-teal-700 text-white shadow-lg"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  window.open(
                    "mailto:support@buddytourguide.com",
                    "_blank",
                  )
                }
                className="flex-1 border-primary text-primary hover:bg-primary hover:text-white"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Message */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Thank you for choosing BuddyTour • Made with ❤️ in
            Alexandria, Egypt
          </p>
        </div>
      </div>
    </div>
  );
}