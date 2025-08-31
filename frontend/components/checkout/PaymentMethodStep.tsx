import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { CreditCard, Shield } from 'lucide-react';
import { FormData } from '../../hooks/useCheckoutForm';

interface PaymentMethodStepProps {
  formData: FormData;
  errors: { [key: string]: string };
  onUpdateFormData: (field: string, value: any) => void;
}

export default function PaymentMethodStep({
  formData,
  errors,
  onUpdateFormData
}: PaymentMethodStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={formData.paymentMethod}
          onValueChange={(value) => onUpdateFormData('paymentMethod', value)}
          className="space-y-4"
        >
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50">
            <RadioGroupItem value="card" id="card" />
            <Label htmlFor="card" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5" />
                <div>
                  <div className="font-medium">Credit/Debit Card</div>
                  <div className="text-sm text-muted-foreground">
                    Pay securely with your card
                  </div>
                </div>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50">
            <RadioGroupItem value="wallet" id="wallet" />
            <Label htmlFor="wallet" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
                <div>
                  <div className="font-medium">Mobile Wallet</div>
                  <div className="text-sm text-muted-foreground">
                    Pay with Vodafone Cash, Orange Money, etc.
                  </div>
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>

        {errors.paymentMethod && (
          <p className="text-sm text-red-500">{errors.paymentMethod}</p>
        )}

        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Your payment information is encrypted and secure</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}