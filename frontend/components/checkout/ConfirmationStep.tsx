import React from 'react';
import { Card, CardContent } from '../ui/card';
import { PartyPopper, CheckCircle2, Mail, Phone, Calendar } from 'lucide-react';
import { FormData } from '../../hooks/useCheckoutForm';

interface ConfirmationStepProps {
  formData: FormData;
  tourTitle?: string;
}

export default function ConfirmationStep({ formData, tourTitle }: ConfirmationStepProps) {
  return (
    <Card>
      <CardContent className="pt-6 text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-green-100 rounded-full p-3">
            <PartyPopper className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-green-700">
            Booking Confirmed!
          </h2>
          <p className="text-muted-foreground">
            Thank you for booking with BuddyTour. Your tour is confirmed!
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Booking Details
          </div>
          
          <div className="text-sm space-y-2">
            <p><strong>Tour:</strong> {tourTitle || 'Alexandria Walking Tour'}</p>
            <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
            {formData.date && (
              <p><strong>Date:</strong> {formData.date} at {formData.time || 'TBD'}</p>
            )}
            <p><strong>Total Amount:</strong> ${formData.total_amount || 'TBD'}</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Confirmation email sent to {formData.email}</span>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <Phone className="h-4 w-4" />
            <span>SMS confirmation sent to {formData.phone}</span>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>You can cancel up to 24 hours before the tour</span>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">What's Next?</h3>
          <ul className="text-sm text-blue-700 space-y-1 text-left">
            <li>• Check your email for detailed tour information</li>
            <li>• Our guide will contact you 1 day before the tour</li>
            <li>• Arrive at the meeting point 10 minutes early</li>
            <li>• Bring comfortable walking shoes and a camera!</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}