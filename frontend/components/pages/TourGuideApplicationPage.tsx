import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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

  const cities = ['Alexandria', 'Cairo', 'Giza', 'Luxor', 'Aswan', 'Hurghada', 'Sharm El Sheikh'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const tourTypesOptions = ['Historical Tours', 'Cultural Tours', 'Food Tours', 'Walking Tours', 'Photography Tours', 'Shopping Tours'];
  const knowledgeOptions = ['Ancient History', 'Islamic Architecture', 'Local Culture', 'Traditional Crafts', 'Cuisine & Food', 'Photography Spots', 'Shopping Areas', 'Hidden Gems'];

  const addLanguage = () => {
    setFormData(prev => ({
      ...prev,
      languages: [...prev.languages, { language: '', proficiency: 'Basic' }]
    }));
  };

  const removeLanguage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const toggleArrayItem = (array: string[], item: string, field: keyof ApplicationData) => {
    const currentArray = formData[field] as string[];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const applicationData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        age: parseInt(formData.age),
        currentCity: formData.currentCity,
        educationLevel: formData.educationLevel,
        currentOccupation: formData.currentOccupation,
        tourExperience: formData.tourExperience,
        languages: formData.languages,
        licenses: formData.licenses,
        preferredCities: formData.preferredCities,
        availableDays: formData.availableDays,
        tourTypes: formData.tourTypes,
        groupSizePreference: formData.groupSizePreference,
        knowledgeAreas: formData.knowledgeAreas,
        specialSkills: formData.specialSkills,
        motivation: formData.motivation,
        uniqueValue: formData.uniqueValue,
        portfolio: formData.portfolio,
        references: formData.references
      };

      console.log('Submitting application:', applicationData);

      const response = await fetch('/api/tour-guide-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData),
      });

      const result = await response.json();

      if (response.ok) {
        setShowSuccessModal(true);
      } else {
        throw new Error(result.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`❌ Error submitting application: ${errorMessage}\n\nPlease check your information and try again. If the problem persists, please contact support.`);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const stepTitles = [
    'Personal Information',
    'Professional Background',
    'Tour Preferences',
    'Qualifications'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-amber-50/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
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

      {/* Progress + Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-coral-50 to-amber-50 rounded-lg border border-coral-200">
                  <Users className="h-6 w-6 text-coral-600" />
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="bg-coral-500 text-white text-xs">
                        Limited Spots
                      </Badge>
                      <span className="text-sm font-medium text-coral-800">Exclusive opportunity</span>
                    </div>
                    <p className="text-xs text-coral-600">
                      We're carefully selecting our founding team of tour guides
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                {stepTitles.map((title, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                      index + 1 <= currentStep 
                        ? 'bg-primary text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`text-xs text-center ${
                      index + 1 <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
                    }`}>
                      {title}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 h-2 rounded ${step <= currentStep ? 'bg-primary' : 'bg-muted'}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-primary" />
                <span>{stepTitles[currentStep - 1]}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Full Name *</label>
                        <input
                          type="text"
                          required
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          value={formData.fullName}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Email Address *</label>
                        <input
                          type="email"
                          required
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="your@email.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+20 xxx xxx xxxx"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Age *</label>
                        <input
                          type="number"
                          required
                          min="18"
                          max="70"
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          value={formData.age}
                          onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                          placeholder="25"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Current City *</label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        value={formData.currentCity}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentCity: e.target.value }))}
                        placeholder="Alexandria"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Professional Background */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Education Level *</label>
                        <select
                          required
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          value={formData.educationLevel}
                          onChange={(e) => setFormData(prev => ({ ...prev, educationLevel: e.target.value }))}
                        >
                          <option value="">Select education level</option>
                          <option value="High School">High School</option>
                          <option value="University">University Degree</option>
                          <option value="Masters">Masters Degree</option>
                          <option value="PhD">PhD</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Current Occupation</label>
                        <input
                          type="text"
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          value={formData.currentOccupation}
                          onChange={(e) => setFormData(prev => ({ ...prev, currentOccupation: e.target.value }))}
                          placeholder="Student, Teacher, etc."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Tour Guide Experience</label>
                      <textarea
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        rows={4}
                        value={formData.tourExperience}
                        onChange={(e) => setFormData(prev => ({ ...prev, tourExperience: e.target.value }))}
                        placeholder="Describe your previous tour guide experience (or why you'd like to start)."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3">Languages *</label>
                      {formData.languages.map((lang, index) => (
                        <div key={index} className="flex gap-3 mb-3">
                          <input
                            type="text"
                            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            value={lang.language}
                            onChange={(e) => {
                              const newLanguages = [...formData.languages];
                              newLanguages[index].language = e.target.value;
                              setFormData(prev => ({ ...prev, languages: newLanguages }));
                            }}
                            placeholder="Language"
                          />
                          <select
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            value={lang.proficiency}
                            onChange={(e) => {
                              const newLanguages = [...formData.languages];
                              newLanguages[index].proficiency = e.target.value as any;
                              setFormData(prev => ({ ...prev, languages: newLanguages }));
                            }}
                          >
                            <option value="Basic">Basic</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Native">Native</option>
                          </select>
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeLanguage(index)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addLanguage}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Language
                      </Button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Licenses & Certifications</label>
                      <textarea
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        rows={3}
                        value={formData.licenses}
                        onChange={(e) => setFormData(prev => ({ ...prev, licenses: e.target.value }))}
                        placeholder="Tourism license, first aid certificate, etc."
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Tour Preferences */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-3">Preferred Cities to Work In *</label>
                      <div className="flex flex-wrap gap-2">
                        {cities.map(city => (
                          <Badge
                            key={city}
                            variant={formData.preferredCities.includes(city) ? "default" : "outline"}
                            className="cursor-pointer p-2 text-sm"
                            onClick={() => toggleArrayItem(formData.preferredCities, city, 'preferredCities')}
                          >
                            {city}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3">Available Days *</label>
                      <div className="flex flex-wrap gap-2">
                        {days.map(day => (
                          <Badge
                            key={day}
                            variant={formData.availableDays.includes(day) ? "default" : "outline"}
                            className="cursor-pointer p-2 text-sm"
                            onClick={() => toggleArrayItem(formData.availableDays, day, 'availableDays')}
                          >
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3">Types of Tours You're Interested In *</label>
                      <div className="flex flex-wrap gap-2">
                        {tourTypesOptions.map(type => (
                          <Badge
                            key={type}
                            variant={formData.tourTypes.includes(type) ? "default" : "outline"}
                            className="cursor-pointer p-2 text-sm"
                            onClick={() => toggleArrayItem(formData.tourTypes, type, 'tourTypes')}
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Group Size Preference</label>
                      <select
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        value={formData.groupSizePreference}
                        onChange={(e) => setFormData(prev => ({ ...prev, groupSizePreference: e.target.value }))}
                      >
                        <option value="">Select preference</option>
                        <option value="1-4 people">Small groups (1-4 people)</option>
                        <option value="5-8 people">Medium groups (5-8 people)</option>
                        <option value="9-15 people">Large groups (9-15 people)</option>
                        <option value="15+ people">Very large groups (15+ people)</option>
                        <option value="Any size">Any size</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 4: Qualifications */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-3">Knowledge Areas *</label>
                      <div className="flex flex-wrap gap-2">
                        {knowledgeOptions.map(area => (
                          <Badge
                            key={area}
                            variant={formData.knowledgeAreas.includes(area) ? "default" : "outline"}
                            className="cursor-pointer p-2 text-sm"
                            onClick={() => toggleArrayItem(formData.knowledgeAreas, area, 'knowledgeAreas')}
                          >
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Special Skills</label>
                      <textarea
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        rows={3}
                        value={formData.specialSkills}
                        onChange={(e) => setFormData(prev => ({ ...prev, specialSkills: e.target.value }))}
                        placeholder="Photography, storytelling, cooking, music, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Why do you want to be a tour guide? *</label>
                      <textarea
                        required
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        rows={4}
                        value={formData.motivation}
                        onChange={(e) => setFormData(prev => ({ ...prev, motivation: e.target.value }))}
                        placeholder="Share your passion for guiding and cultural exchange..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">What makes you unique as a guide? *</label>
                      <textarea
                        required
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        rows={4}
                        value={formData.uniqueValue}
                        onChange={(e) => setFormData(prev => ({ ...prev, uniqueValue: e.target.value }))}
                        placeholder="What special value or unique perspective can you offer to tourists?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Portfolio / Examples of Previous Work</label>
                      <textarea
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        rows={3}
                        value={formData.portfolio}
                        onChange={(e) => setFormData(prev => ({ ...prev, portfolio: e.target.value }))}
                        placeholder="Links to social media, websites, or descriptions of previous guiding work"
                      />
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-8 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    size="lg"
                  >
                    Previous
                  </Button>

                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      size="lg"
                      className="bg-gradient-to-r from-primary to-teal-600 hover:from-teal-700 hover:to-teal-700"
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      size="lg"
                      className="bg-gradient-to-r from-primary to-teal-600 hover:from-teal-700 hover:to-teal-700 px-8"
                    >
                      Submit Application
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 relative">
            <button
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/');
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
                <p>
                  Thank you for your interest in becoming a tour guide with BuddyTour!
                </p>
                <p>
                  We will review your application within <strong>1 week</strong> and get back to you via email at <strong>{formData.email}</strong>.
                </p>
              </div>

              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/');
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
