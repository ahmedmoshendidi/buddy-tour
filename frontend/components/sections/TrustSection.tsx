import React from 'react';

export default function TrustSection() {
  return (
    <section className="py-12 bg-gradient-to-r from-primary to-teal-600">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
          <div>
            <div className="text-3xl font-bold mb-2">2000+</div>
            <div className="text-white/90">Years of History</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">100%</div>
            <div className="text-white/90">Verified Local Guides</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">4.8★</div>
            <div className="text-white/90">Average Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
}