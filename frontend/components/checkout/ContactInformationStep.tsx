import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { User, Mail, Phone, Globe } from 'lucide-react';
import { COUNTRIES } from '../../constants/countries';
import { FormData } from '../../hooks/useCheckoutForm';

interface ContactInformationStepProps {
  formData: FormData;
  errors: { [key: string]: string };
  onUpdateFormData: (field: string, value: any) => void;
}

export default function ContactInformationStep({
  formData,
  errors,
  onUpdateFormData
}: ContactInformationStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => onUpdateFormData('firstName', e.target.value)}
              className={errors.firstName ? 'border-red-500' : ''}
              placeholder="Enter your first name"
            />
            {errors.firstName && (
              <p className="text-sm text-red-500">{errors.firstName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => onUpdateFormData('lastName', e.target.value)}
              className={errors.lastName ? 'border-red-500' : ''}
              placeholder="Enter your last name"
            />
            {errors.lastName && (
              <p className="text-sm text-red-500">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onUpdateFormData('email', e.target.value)}
            className={errors.email ? 'border-red-500' : ''}
            placeholder="Enter your email address"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => onUpdateFormData('phone', e.target.value)}
            className={errors.phone ? 'border-red-500' : ''}
            placeholder="Enter your phone number"
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nationality" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Nationality <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.nationality}
            onValueChange={(value) => onUpdateFormData('nationality', value)}
          >
            <SelectTrigger className={errors.nationality ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select your nationality" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.nationality && (
            <p className="text-sm text-red-500">{errors.nationality}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}