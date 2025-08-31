import React from 'react';
import { Compass, Calendar, Shield, Star, Globe } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      step: 1,
      title: 'Choose Your Adventure',
      description: 'Browse our curated selection of authentic walking tours led by verified local guides.',
      icon: Compass,
      color: 'from-primary to-teal-600'
    },
    {
      step: 2,
      title: 'Select Date & Time',
      description: 'Pick your preferred date, time slot, and number of guests for your tour experience.',
      icon: Calendar,
      color: 'from-amber-500 to-coral-500'
    },
    {
      step: 3,
      title: 'Book Securely',
      description: 'Provide your details and complete payment securely through our encrypted booking system.',
      icon: Shield,
      color: 'from-coral-500 to-primary'
    },
    {
      step: 4,
      title: 'Explore & Connect',
      description: 'Meet your local buddy and discover Alexandria\'s hidden gems and authentic Arabic hospitality.',
      icon: Star,
      color: 'from-teal-500 to-amber-500'
    }
  ];

  return (
    <section id="how-it-works" className="py-16 bg-gradient-to-b from-muted/30 to-amber-50/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center mb-4 px-4 py-2 bg-gradient-to-r from-amber-50 to-teal-50 rounded-full">
            <Globe className="h-5 w-5 mr-2 text-amber-600" />
            <span className="text-primary font-medium">Simple Process</span>
          </div>
          <h3 className="text-3xl mb-4">How BuddyTour Works</h3>
          <p className="text-lg text-muted-foreground">
            Connect with local Arabic culture in four simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((item) => (
            <div key={item.step} className="text-center group">
              <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className="h-8 w-8 text-white" />
              </div>
              <div className="text-sm text-amber-600 mb-2 font-medium">Step {item.step}</div>
              <h4 className="mb-3 font-semibold">{item.title}</h4>
              <p className="text-muted-foreground text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}