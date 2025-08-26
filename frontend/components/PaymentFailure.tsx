import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, RotateCcw, Home, Phone, Mail, HelpCircle, Shield } from 'lucide-react';

interface PaymentFailureProps {
  onBackToHome: () => void;
  onRetryPayment: () => void;
}

export default function PaymentFailure({ onBackToHome, onRetryPayment }: PaymentFailureProps) {
  const [transactionId, setTransactionId] = useState<string>('');
  const [errorReason, setErrorReason] = useState<string>('');

  useEffect(() => {
    // Read URL parameters for error details
    const urlParams = new URLSearchParams(window.location.search);
    const txId = urlParams.get('id') || urlParams.get('transaction_id');
    const reason = urlParams.get('reason') || urlParams.get('error');

    if (txId) {
      setTransactionId(txId);
    }

    if (reason) {
      setErrorReason(reason);
    }

     const t = setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const getErrorMessage = (reason: string) => {
    const lowerReason = reason.toLowerCase();
    if (lowerReason.includes('insufficient')) {
      return 'Insufficient funds in your account. Please check your balance and try again.';
    } else if (lowerReason.includes('declined')) {
      return 'Your payment was declined by your bank. Please contact your bank or try a different card.';
    } else if (lowerReason.includes('expired')) {
      return 'Your card has expired. Please use a different payment method.';
    } else if (lowerReason.includes('network') || lowerReason.includes('timeout')) {
      return 'Network timeout occurred. Please check your connection and try again.';
    } else if (lowerReason.includes('invalid')) {
      return 'Invalid payment information. Please verify your card details and try again.';
    }
    return reason || 'An unexpected error occurred during payment processing.';
  };

  const getErrorIcon = (reason: string) => {
    const lowerReason = reason.toLowerCase();
    if (lowerReason.includes('network') || lowerReason.includes('timeout')) {
      return '🌐';
    } else if (lowerReason.includes('card') || lowerReason.includes('expired')) {
      return '💳';
    } else if (lowerReason.includes('insufficient')) {
      return '💰';
    }
    return '⚠️';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral-50 via-amber-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Error Animation Container */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-coral-500 to-red-500 rounded-full opacity-20 animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-coral-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
              <AlertCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl mb-4 text-red-600">
            Payment Failed
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            Don't worry, let's get this sorted out
          </p>
          <p className="text-amber-600 font-medium">
            Your Alexandria adventure is still waiting for you! 🏛️
          </p>
        </div>

        {/* Main Error Card */}
        <Card className="border-2 border-coral-200 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Error Details */}
            <div className="bg-gradient-to-r from-coral-50 to-red-50 rounded-lg p-6 mb-6 border-l-4 border-coral-500">
              <h3 className="text-lg font-semibold text-coral-700 mb-4 flex items-center">
                <span className="text-xl mr-2">{getErrorIcon(errorReason)}</span>
                What Went Wrong?
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Error Details</label>
                  <p className="mt-1 text-coral-700 font-medium">
                    {getErrorMessage(errorReason)}
                  </p>
                </div>
                
                {transactionId && (
                  <div>
                    <label className="text-sm text-muted-foreground">Reference ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="font-mono border-coral-300 text-coral-700">
                        {transactionId}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Solutions */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                Quick Solutions
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-gradient-to-r from-teal-50 to-amber-50 rounded-lg border border-teal-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">Verify Payment Info</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Double-check your card details, expiry date, and security code
                  </p>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-amber-50 to-coral-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-700">Contact Your Bank</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your bank may be blocking international transactions
                  </p>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-coral-50 to-teal-50 rounded-lg border border-coral-200">
                  <div className="flex items-center gap-2 mb-2">
                    <RotateCcw className="h-4 w-4 text-coral-600" />
                    <span className="font-medium text-coral-700">Try Again</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Network issues can sometimes cause temporary failures
                  </p>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-teal-50 to-amber-50 rounded-lg border border-teal-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">Get Help</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Our support team is ready to assist you
                  </p>
                </div>
              </div>
            </div>

            {/* Support Section */}
            <div className="bg-gradient-to-r from-muted/30 to-amber-50/30 rounded-lg p-4 mb-6 border border-border">
              <h4 className="font-medium text-primary mb-2 flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Need Immediate Help?
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Our team is available 24/7 to help resolve payment issues and secure your booking.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white">
                  📧 support@buddytour.com
                </Badge>
                <Badge variant="outline" className="bg-white">
                  📱 +20 123 456 789
                </Badge>
                <Badge variant="outline" className="bg-white">
                  💬 Live Chat Available
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={onRetryPayment}
                className="flex-1 bg-gradient-to-r from-coral-500 to-red-500 hover:from-coral-600 hover:to-red-600 text-white shadow-lg"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry Payment
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.open('mailto:support@buddytour.com?subject=Payment%20Issue%20-%20' + (transactionId || 'Help%20Needed'), '_blank')}
                className="flex-1 border-primary text-primary hover:bg-primary hover:text-white"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              
              <Button 
                variant="ghost"
                onClick={onBackToHome}
                className="flex-1 text-muted-foreground hover:text-primary"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Message */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Don't give up on your Alexandria adventure • We're here to help • BuddyTour Support Team
          </p>
        </div>
      </div>
    </div>
  );
}