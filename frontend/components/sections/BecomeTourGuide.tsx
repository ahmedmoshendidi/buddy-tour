import React from 'react';
import { Users, MapPin, Star, DollarSign, Clock, UserCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface BecomeTourGuideProps {
  onApplyClick: () => void;
}

export default function BecomeTourGuide({ onApplyClick }: BecomeTourGuideProps) {
  const benefits = [
    {
      title: 'Flexible Schedule',
      description: 'Work on your own terms. Choose when and how often you want to guide tours.',
      icon: Clock,
      color: 'from-primary to-teal-600'
    },
    {
      title: 'Great Earnings',
      description: 'Earn competitive rates for sharing your knowledge and passion for Alexandria.',
      icon: DollarSign,
      color: 'from-amber-500 to-coral-500'
    },
    {
      title: 'Meet New People',
      description: 'Connect with travelers from around the world and share authentic Arabic culture.',
      icon: Users,
      color: 'from-coral-500 to-primary'
    },
    {
      title: 'Build Your Reputation',
      description: 'Get reviews and ratings that help you grow your guiding career.',
      icon: Star,
      color: 'from-teal-500 to-amber-500'
    }
  ];

  return (
    <section id="become-tour-guide" className="py-16 bg-gradient-to-b from-muted/30 to-amber-50/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center mb-4 px-4 py-2 bg-gradient-to-r from-amber-50 to-teal-50 rounded-full">
            <MapPin className="h-5 w-5 mr-2 text-amber-600" />
            <span className="text-primary font-medium">Join Our Network</span>
          </div>
          <h3 className="text-3xl mb-4">Become a Tour Guide</h3>
          <p className="text-lg text-muted-foreground mb-6">
            Share your love for Alexandria and earn money doing what you enjoy
          </p>
          
          {/* Scarcity Banner */}
          <div className="inline-flex items-center gap-3 mb-8 p-4 bg-gradient-to-r from-coral-50 to-amber-50 rounded-lg border border-coral-200">
            <UserCheck className="h-6 w-6 text-coral-600" />
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center group">
              <div className={`w-16 h-16 bg-gradient-to-br ${benefit.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <benefit.icon className="h-8 w-8 text-white" />
              </div>
              <h4 className="mb-3 font-semibold">{benefit.title}</h4>
              <p className="text-muted-foreground text-sm">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Button 
            size="lg"
            onClick={onApplyClick}
            className="bg-gradient-to-r from-primary to-teal-600 hover:from-teal-700 hover:to-teal-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Apply to Become a Guide
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Application review takes less than 1 week
          </p>
        </div>
      </div>
    </section>
  );
}