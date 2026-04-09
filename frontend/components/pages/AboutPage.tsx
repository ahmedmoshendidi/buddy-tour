import React from 'react';
import { Compass, Users, MapPin, Star, Shield, Target } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-amber-50/20 py-20">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-teal-600 rounded-2xl shadow-lg mx-auto mb-6">
            <Compass className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent mb-6">
            About BuddyTour
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We are revolutionizing the way you experience Alexandria. Our mission is to connect curious travelers with passionate local guides, creating authentic, unforgettable journeys rooted in Egyptian culture and Mediterranean heritage.
          </p>
        </div>

        {/* Core Values Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white/70 backdrop-blur-sm">
            <CardContent className="p-8 text-center h-full">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Local Expertise</h3>
              <p className="text-muted-foreground">Our guides are proud locals who know the hidden gems, historical secrets, and the best local cuisines.</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white/70 backdrop-blur-sm">
            <CardContent className="p-8 text-center h-full">
              <div className="mx-auto w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Licensed Professionals</h3>
              <p className="text-muted-foreground">Your safety and experience are paramount. We strictly select only officially licensed tour guides to work on our platform, not just anyone.</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white/70 backdrop-blur-sm">
            <CardContent className="p-8 text-center h-full">
              <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                <Star className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Authentic Experiences</h3>
              <p className="text-muted-foreground">Go beyond the typical tourist traps. We offer immersive cultural encounters that you won't find in standard guidebooks.</p>
            </CardContent>
          </Card>
        </div>

        {/* Vision Section */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-sm border border-muted/50 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-foreground">Our Vision & Platform</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                BuddyTour was born out of a simple idea: traveling should be about human connection. As a dedicated tourism marketplace, the professionals offering services on our platform operate independently, bringing their expertise directly to travelers.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We envision a world where anyone can step into a new city and instantly find a knowledgeable, licensed tour guide to show them around. By empowering certified tour guides to run their own businesses, we are fostering sustainable tourism while ensuring high-quality, trustworthy experiences.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/5 rounded-2xl p-6 text-center flex flex-col justify-center">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-3" />
                <h4 className="font-bold text-2xl text-foreground">10+</h4>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Destinations</p>
              </div>
              <div className="bg-teal-50 rounded-2xl p-6 text-center flex flex-col justify-center">
                <Users className="h-8 w-8 text-teal-600 mx-auto mb-3" />
                <h4 className="font-bold text-2xl text-foreground">50+</h4>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Local Guides</p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-6 text-center flex flex-col justify-center">
                <Star className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                <h4 className="font-bold text-2xl text-foreground">100%</h4>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Authenticity</p>
              </div>
              <div className="bg-coral-50 rounded-2xl p-6 text-center flex flex-col justify-center">
                <Target className="h-8 w-8 text-coral-600 mx-auto mb-3" />
                <h4 className="font-bold text-2xl text-foreground">1</h4>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Mission</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
