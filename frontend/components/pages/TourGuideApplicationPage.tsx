import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ استخدمنا الـ router هنا
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ArrowLeft, Plus, Minus, MapPin, Users, Star, CheckCircle, X } from 'lucide-react';

interface Language {
  language: string;
  proficiency: 'Basic' | 'Intermediate' | 'Advanced' | 'Native';
}

interface ApplicationData {
  fullName: string;
  email: string;
  phone: string;
  age: string;
  currentCity: string;
  educationLevel: string;
  currentOccupation: string;
  tourExperience: string;
  languages: Language[];
  licenses: string;
  preferredCities: string[];
  availableDays: string[];
  tourTypes: string[];
  groupSizePreference: string;
  knowledgeAreas: string[];
  specialSkills: string;
  motivation: string;
  uniqueValue: string;
  portfolio: string;
  references: string;
}

export default function TourGuideApplicationPage() {
  const navigate = useNavigate(); // ✅ بدل onBackToHome
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState<ApplicationData>({
    fullName: '',
    email: '',
    phone: '',
    age: '',
    currentCity: '',
    educationLevel: '',
    currentOccupation: '',
    tourExperience: '',
    languages: [{ language: 'Arabic', proficiency: 'Native' }],
    licenses: '',
    preferredCities: [],
    availableDays: [],
    tourTypes: [],
    groupSizePreference: '',
    knowledgeAreas: [],
    specialSkills: '',
    motivation: '',
    uniqueValue: '',
    portfolio: '',
    references: ''
  });

  const handleChange = (field: keyof ApplicationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => setCurrentStep(prev => prev + 1);
  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting application:', formData);
    setShowSuccessModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-amber-50/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* ✅ navigate بدل onBackToHome */}
              <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>

              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
                  Become a Tour Guide
                </h1>
                <p className="text-sm text-muted-foreground">Join our exclusive network of local guides</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Step {currentStep} of 4</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto shadow-lg border border-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-primary">Tour Guide Application Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Personal Information</h2>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={e => handleChange('fullName', e.target.value)}
                    className="w-full border rounded-lg p-2"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    className="w-full border rounded-lg p-2"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Tour Experience</h2>
                  <textarea
                    placeholder="Describe your tour guiding experience"
                    value={formData.tourExperience}
                    onChange={e => handleChange('tourExperience', e.target.value)}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Languages</h2>
                  {formData.languages.map((lang, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Language"
                        value={lang.language}
                        onChange={e => {
                          const newLangs = [...formData.languages];
                          newLangs[index].language = e.target.value;
                          handleChange('languages', newLangs);
                        }}
                        className="flex-1 border rounded-lg p-2"
                      />
                      <select
                        value={lang.proficiency}
                        onChange={e => {
                          const newLangs = [...formData.languages];
                          newLangs[index].proficiency = e.target.value as Language['proficiency'];
                          handleChange('languages', newLangs);
                        }}
                        className="border rounded-lg p-2"
                      >
                        <option>Basic</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                        <option>Native</option>
                      </select>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleChange('languages', [...formData.languages, { language: '', proficiency: 'Basic' }])}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Add Language
                  </Button>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Motivation</h2>
                  <textarea
                    placeholder="Why do you want to join BuddyTour as a guide?"
                    value={formData.motivation}
                    onChange={e => handleChange('motivation', e.target.value)}
                    className="w-full border rounded-lg p-2"
                    required
                  />
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => (currentStep === 1 ? navigate('/') : handleBack())}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {currentStep === 1 ? 'Back to Home' : 'Previous'}
                </Button>

                {currentStep < 4 ? (
                  <Button onClick={handleNext} className="flex items-center gap-2">
                    Next
                  </Button>
                ) : (
                  <Button type="submit" className="bg-gradient-to-r from-primary to-teal-600 hover:from-teal-700 hover:to-teal-700">
                    Submit Application
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 relative">
            <button
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/'); // ✅ استخدمنا navigate هنا
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="p-8 text-center">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Application Submitted Successfully!
                </h3>
              </div>

              <div className="text-gray-600 mb-6 space-y-3">
                <p>Thank you for your interest in becoming a tour guide with BuddyTour!</p>
                <p>We will review your application within <strong>1 week</strong> and contact you via email at <strong>{formData.email}</strong>.</p>
              </div>

              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/'); // ✅ هنا كمان
                }}
                size="lg"
                className="bg-gradient-to-r from-primary to-teal-600 hover:from-teal-700 hover:to-teal-700 w-full"
              >
                حسناً
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
