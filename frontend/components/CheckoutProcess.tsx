import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Shield } from 'lucide-react';
import { useCurrency } from './CurrencyContext';
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  CreditCard,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Star,
  PartyPopper,
  CheckCircle2,
  Calendar,
  Users,
  AlertCircle
} from 'lucide-react';

interface FormData {
  // Phase 1: Contact Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  
  // Phase 2: Payment Method
  paymentMethod: string;
  
  // Booking data from session
  tour_id?: number;
  date?: string;
  time?: string;
  adults?: number;
  children?: number;
  total_amount?: number;
  price_per_person?: number;
  [key: string]: any;
}

interface CheckoutProcessProps {
  onBack: () => void;
}

const steps = [
  {
    id: 1,
    title: 'Contact Information',
    description: 'Your personal details'
  },
  {
    id: 2,
    title: 'Payment Method',
    description: 'Complete payment'
  },
  {
    id: 3,
    title: 'Confirmation',
    description: 'Booking complete!'
  }
];

const countries = [
  { value: 'EG', label: 'Egypt 🇪🇬' },
  { value: 'SA', label: 'Saudi Arabia 🇸🇦' },
  { value: 'AE', label: 'United Arab Emirates 🇦🇪' },
  { value: 'US', label: 'United States 🇺🇸' },
  { value: 'GB', label: 'United Kingdom 🇬🇧' },
  { value: 'DE', label: 'Germany 🇩🇪' },
  { value: 'FR', label: 'France 🇫🇷' },
  { value: 'IT', label: 'Italy 🇮🇹' },
  { value: 'ES', label: 'Spain 🇪🇸' },
  { value: 'CA', label: 'Canada 🇨🇦' },
  { value: 'AU', label: 'Australia 🇦🇺' },
  { value: 'JP', label: 'Japan 🇯🇵' },
  { value: 'CN', label: 'China 🇨🇳' },
  { value: 'IN', label: 'India 🇮🇳' },
  { value: 'BR', label: 'Brazil 🇧🇷' },
  { value: 'RU', label: 'Russia 🇷🇺' },
  { value: 'MX', label: 'Mexico 🇲🇽' },
  { value: 'KR', label: 'South Korea 🇰🇷' },
  { value: 'NL', label: 'Netherlands 🇳🇱' },
  { value: 'SE', label: 'Sweden 🇸🇪' },
  { value: 'NO', label: 'Norway 🇳🇴' },
  { value: 'DK', label: 'Denmark 🇩🇰' },
  { value: 'FI', label: 'Finland 🇫🇮' },
  { value: 'CH', label: 'Switzerland 🇨🇭' },
  { value: 'AT', label: 'Austria 🇦🇹' },
  { value: 'BE', label: 'Belgium 🇧🇪' },
  { value: 'PT', label: 'Portugal 🇵🇹' },
  { value: 'GR', label: 'Greece 🇬🇷' },
  { value: 'PL', label: 'Poland 🇵🇱' },
  { value: 'CZ', label: 'Czech Republic 🇨🇿' },
  { value: 'HU', label: 'Hungary 🇭🇺' },
  { value: 'RO', label: 'Romania 🇷🇴' },
  { value: 'BG', label: 'Bulgaria 🇧🇬' },
  { value: 'HR', label: 'Croatia 🇭🇷' },
  { value: 'SI', label: 'Slovenia 🇸🇮' },
  { value: 'SK', label: 'Slovakia 🇸🇰' },
  { value: 'EE', label: 'Estonia 🇪🇪' },
  { value: 'LV', label: 'Latvia 🇱🇻' },
  { value: 'LT', label: 'Lithuania 🇱🇹' },
  { value: 'IE', label: 'Ireland 🇮🇪' },
  { value: 'IS', label: 'Iceland 🇮🇸' },
  { value: 'TR', label: 'Turkey 🇹🇷' },
  { value: 'JO', label: 'Jordan 🇯🇴' },
  { value: 'LB', label: 'Lebanon 🇱🇧' },
  { value: 'SY', label: 'Syria 🇸🇾' },
  { value: 'IQ', label: 'Iraq 🇮🇶' },
  { value: 'KW', label: 'Kuwait 🇰🇼' },
  { value: 'QA', label: 'Qatar 🇶🇦' },
  { value: 'BH', label: 'Bahrain 🇧🇭' },
  { value: 'OM', label: 'Oman 🇴🇲' },
  { value: 'YE', label: 'Yemen 🇾🇪' },
  { value: 'MA', label: 'Morocco 🇲🇦' },
  { value: 'TN', label: 'Tunisia 🇹🇳' },
  { value: 'DZ', label: 'Algeria 🇩🇿' },
  { value: 'LY', label: 'Libya 🇱🇾' },
  { value: 'SD', label: 'Sudan 🇸🇩' },
  { value: 'ZA', label: 'South Africa 🇿🇦' },
  { value: 'NG', label: 'Nigeria 🇳🇬' },
  { value: 'KE', label: 'Kenya 🇰🇪' },
  { value: 'ET', label: 'Ethiopia 🇪🇹' },
  { value: 'GH', label: 'Ghana 🇬🇭' },
  { value: 'TH', label: 'Thailand 🇹🇭' },
  { value: 'VN', label: 'Vietnam 🇻🇳' },
  { value: 'MY', label: 'Malaysia 🇲🇾' },
  { value: 'SG', label: 'Singapore 🇸🇬' },
  { value: 'ID', label: 'Indonesia 🇮🇩' },
  { value: 'PH', label: 'Philippines 🇵🇭' },
  { value: 'NZ', label: 'New Zealand 🇳🇿' },
  { value: 'AR', label: 'Argentina 🇦🇷' },
  { value: 'CL', label: 'Chile 🇨🇱' },
  { value: 'CO', label: 'Colombia 🇨🇴' },
  { value: 'PE', label: 'Peru 🇵🇪' },
  { value: 'VE', label: 'Venezuela 🇻🇪' },
  { value: 'UY', label: 'Uruguay 🇺🇾' },
  { value: 'EC', label: 'Ecuador 🇪🇨' },
  { value: 'BO', label: 'Bolivia 🇧🇴' },
  { value: 'PY', label: 'Paraguay 🇵🇾' },
  { value: 'PK', label: 'Pakistan 🇵🇰' },
  { value: 'BD', label: 'Bangladesh 🇧🇩' },
  { value: 'LK', label: 'Sri Lanka 🇱🇰' },
  { value: 'NP', label: 'Nepal 🇳🇵' },
  { value: 'MM', label: 'Myanmar 🇲🇲' },
  { value: 'KH', label: 'Cambodia 🇰🇭' },
  { value: 'LA', label: 'Laos 🇱🇦' },
  { value: 'MN', label: 'Mongolia 🇲🇳' },
  { value: 'KZ', label: 'Kazakhstan 🇰🇿' },
  { value: 'UZ', label: 'Uzbekistan 🇺🇿' },
  { value: 'GE', label: 'Georgia 🇬🇪' },
  { value: 'AM', label: 'Armenia 🇦🇲' },
  { value: 'AZ', label: 'Azerbaijan 🇦🇿' }
];

const paymentMethods = [
  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Pay securely with Visa, Mastercard, or other cards via Paymob' },
];

export default function CheckoutProcess({ onBack }: CheckoutProcessProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    paymentMethod: 'card'
  });
  const { formatPrice } = useCurrency();

  // Load booking data from sessionStorage on component mount
  useEffect(() => {
    const bookingDataRaw = sessionStorage?.getItem('bookingInfo');
    if (bookingDataRaw) {
      try {
        const bookingData = JSON.parse(bookingDataRaw);
        setFormData(prev => ({ ...prev, ...bookingData }));
      } catch (error) {
        console.error('Error parsing booking data:', error);
      }
    }
  }, []);

  // Listen for payment completion (from payment gateway return)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const orderId = urlParams.get('order_id');
    
    if (success === 'true' && orderId) {
      // Payment was successful, show confirmation
      setPaymentCompleted(true);
      setCurrentStep(3);
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (success === 'false') {
      // Payment failed
      setErrors({ submit: 'Payment was unsuccessful. Please try again.' });
      setCurrentStep(2);
    }
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'This field is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'This field is required';
      if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'This field is required';
      if (!formData.phone.trim()) newErrors.phone = 'This field is required';
      if (!formData.nationality) newErrors.nationality = 'This field is required';
    }

    if (step === 2) {
      if (!formData.paymentMethod) newErrors.paymentMethod = 'Please select a payment method';
      // Validate required booking data
      if (!formData.tour_id) newErrors.submit = 'Missing tour information. Please go back and try again.';
      if (!formData.date || !formData.time) newErrors.submit = 'Missing tour date/time. Please go back and select.';
      if (!formData.adults && !formData.children) newErrors.submit = 'Please select at least one ticket.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2) {
        // Process payment
        handlePayment();
      } else {
        setCurrentStep(prev => Math.min(prev + 1, 3));
      }
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePayment = async () => {
    if (!validateStep(2)) return;

    setIsLoading(true);
    setErrors({}); // Clear any previous errors
    
    try {
      // Prepare data in the exact format your backend expects
      const paymentData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        nationality: formData.nationality,
        tour_id: formData.tour_id,
        date: formData.date,
        time: formData.time,
        adults: formData.adults || 0,
        children: formData.children || 0
      };

      console.log('Sending payment data:', paymentData); // Debug log

      const response = await fetch('/api/pay', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Add any additional headers your backend might need
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();
      
      console.log('Payment response:', data); // Debug log

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to initiate payment`);
      }

      if (!data.iframe_url && !data.payment_url) {
        throw new Error('No payment URL received from server');
      }

      // Redirect to Paymob payment gateway
      const paymentUrl = data.iframe_url || data.payment_url;
      console.log('Redirecting to payment URL:', paymentUrl);
      
      // Store current booking info before redirect
      sessionStorage.setItem('checkoutData', JSON.stringify(formData));
      
      // Redirect to Paymob payment page
      window.location.href = paymentUrl;
      
    } catch (error: any) {
      console.error('Payment error:', error);
      setErrors({ 
        submit: error.message || 'Failed to process payment. Please check your information and try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    return timeStr ? timeStr.slice(0, 5) : '';
  };

  const progress = (currentStep / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-amber-50/20 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-teal-600 rounded-lg shadow-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold ml-3 bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
              Complete Your Booking
            </h1>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-300
                  ${currentStep > step.id 
                    ? 'bg-gradient-to-br from-primary to-teal-600 text-white shadow-lg' 
                    : currentStep === step.id 
                    ? 'bg-gradient-to-br from-amber-400 to-coral-500 text-white shadow-lg'
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <div className="text-center mt-2">
                  <div className="font-medium text-sm">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    absolute h-0.5 top-5 transform translate-x-1/2 transition-all duration-300
                    ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}
                  `} style={{ 
                    width: 'calc(100% / 3 - 2.5rem)',
                    left: `calc(${((index + 1) / 3) * 100}% - 1.25rem)`
                  }} />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form Content */}
        <Card className="shadow-lg border border-border/50">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-amber-50 border-b">
            <CardTitle className="flex items-center text-primary">
              {currentStep === 1 && <><User className="h-5 w-5 mr-2" /> Contact Information</>}
              {currentStep === 2 && <><CreditCard className="h-5 w-5 mr-2" /> Payment</>}
              {currentStep === 3 && <><PartyPopper className="h-5 w-5 mr-2" /> Booking Confirmed!</>}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Step 1: Contact Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-foreground font-medium">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => updateFormData('firstName', e.target.value)}
                      placeholder="Enter your first name"
                      className={errors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 font-medium mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName" className="text-foreground font-medium">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => updateFormData('lastName', e.target.value)}
                      placeholder="Enter your last name"
                      className={errors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 font-medium mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-foreground font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="example@gmail.com"
                    className={errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-red-500 font-medium mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-foreground font-medium">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    className={errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-red-500 font-medium mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-foreground font-medium">
                    Nationality <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.nationality} onValueChange={(value) => updateFormData('nationality', value)}>
                    <SelectTrigger className={errors.nationality ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-border shadow-lg max-h-64 overflow-y-auto z-50">
                      {countries.map((country) => (
                        <SelectItem 
                          key={country.value} 
                          value={country.value}
                          className="hover:bg-muted focus:bg-muted cursor-pointer"
                        >
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.nationality && (
                    <p className="text-red-500 font-medium mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.nationality}
                    </p>
                  )}
                </div>

                {/* Booking Summary */}
                {formData.total_amount && (
                  <div className="bg-gradient-to-r from-teal-50 to-amber-50 p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2 text-primary">Your Booking</h4>
                    <div className="space-y-2 text-sm">
                      {formData.date && (
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span className="font-medium">{formatDate(formData.date)}</span>
                        </div>
                      )}
                      {formData.time && (
                        <div className="flex justify-between">
                          <span>Time:</span>
                          <span className="font-medium">{formatTime(formData.time)}</span>
                        </div>
                      )}
                      {(formData.adults || formData.children) && (
                        <div className="flex justify-between">
                          <span>Guests:</span>
                          <span className="font-medium">
                            {formData.adults || 0} adult{(formData.adults || 0) !== 1 ? 's' : ''}
                            {formData.children ? ` + ${formData.children} child${formData.children !== 1 ? 'ren' : ''}` : ''}
                          </span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-semibold text-primary">
                        <span>Total:</span>
                        <span>{formatPrice(formData.total_amount)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label>Choose Payment Method</Label>
                  <RadioGroup 
                    value={formData.paymentMethod} 
                    onValueChange={(value) => updateFormData('paymentMethod', value)}
                    className="mt-4"
                  >
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                        <div className="flex items-center flex-1">
                          <method.icon className="h-6 w-6 mr-3 text-primary" />
                          <div className="flex-1">
                            <Label htmlFor={method.id} className="cursor-pointer font-medium">
                              {method.name}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">{method.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                  {errors.paymentMethod && (
                    <p className="text-red-500 font-medium mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.paymentMethod}
                    </p>
                  )}
                </div>

                {/* Final Summary */}
                <div className="bg-gradient-to-r from-primary/5 to-teal-50 p-6 rounded-lg border border-primary/20">
                  <h4 className="font-semibold mb-4 text-primary flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Payment Summary
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-medium">{formData.email}</span>
                    </div>
                    {formData.date && (
                      <div className="flex justify-between">
                        <span>Date & Time:</span>
                        <span className="font-medium">
                          {formatDate(formData.date)} at {formatTime(formData.time || '')}
                        </span>
                      </div>
                    )}
                    {(formData.adults || formData.children) && (
                      <div className="flex justify-between">
                        <span>Tickets:</span>
                        <span className="font-medium">
                          {formData.adults || 0} adult{(formData.adults || 0) !== 1 ? 's' : ''}
                          {formData.children ? ` + ${formData.children} child${formData.children !== 1 ? 'ren' : ''}` : ''}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold text-primary">
                      <span>Total Amount:</span>
                      <span>{formatPrice(formData.total_amount || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="text-blue-800 font-medium mb-1">Secure Payment</p>
                      <p className="text-blue-700">
                        Your payment is processed securely through Paymob. Your card details are encrypted and never stored on our servers.
                      </p>
                    </div>
                  </div>
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-red-800 font-medium">Payment Error</p>
                        <p className="text-red-700 text-sm mt-1">{errors.submit}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-semibold text-primary mb-2">Booking Confirmed!</h2>
                  <p className="text-muted-foreground">
                    Thank you {formData.firstName}! Your tour has been successfully booked and payment confirmed.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-lg border border-green-200">
                  <h4 className="font-semibold mb-4 text-green-800 flex items-center justify-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Confirmation Email Sent
                  </h4>
                  <p className="text-sm text-green-700">
                    We've sent a confirmation email to <strong>{formData.email}</strong> with all your tour details, 
                    meeting point information, and your guide's contact details.
                  </p>
                </div>

                <div className="space-y-3 text-left bg-muted/30 p-4 rounded-lg">
                  <h5 className="font-semibold text-primary">What's Next?</h5>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      Check your email for detailed tour information and receipt
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      Your guide will contact you 24 hours before the tour
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      Arrive at the meeting point 15 minutes early
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      Free cancellation up to 24 hours before your tour
                    </li>
                  </ul>
                </div>

                <Button 
                  onClick={onBack}
                  className="bg-gradient-to-r from-primary to-teal-600 hover:from-teal-700 hover:to-teal-700"
                >
                  Back to Tours
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        {currentStep < 3 && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? onBack : handlePrev}
              disabled={isLoading}
              className="flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? 'Back to Tickets' : 'Previous'}
            </Button>

            <Button 
              onClick={handleNext} 
              disabled={isLoading}
              className={`
                ${currentStep === 1 
                  ? 'bg-gradient-to-r from-primary to-teal-600 hover:from-teal-700 hover:to-teal-700' 
                  : 'bg-gradient-to-r from-amber-500 to-coral-500 hover:from-amber-600 hover:to-coral-600'
                }
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {currentStep === 2 ? 'Processing Payment...' : 'Processing...'}
                </>
              ) : (
                <>
                  {currentStep === 1 ? 'Continue to Payment' : 'Pay Now'}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}