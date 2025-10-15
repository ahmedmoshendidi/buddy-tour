import React from 'react';

export default function CancellationPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-semibold mb-6 text-primary">Cancellation Policy</h1>
      <p className="text-muted-foreground mb-4">
        At BuddyTour, we understand that travel plans can change. To make things easy for both travelers and guides, we follow a flexible and fair cancellation policy.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-primary">Free Cancellation</h2>
      <p className="text-muted-foreground mb-4">
        You can cancel your booking for <strong>free up to 24 hours before the tour start time</strong>. You’ll receive a full refund within 3–5 business days.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-primary">Late Cancellation</h2>
      <p className="text-muted-foreground mb-4">
        If you cancel less than <strong>24 hours before the tour</strong>, a small fee of <strong>20% of the total booking amount</strong> will be charged to cover guide preparation and scheduling costs.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-primary">No-Show Policy</h2>
      <p className="text-muted-foreground mb-4">
        If you don’t show up for your booked tour without prior notice, the full booking amount will be charged and no refund will be issued.
      </p>

      <p className="text-muted-foreground mt-8">
        For any questions or exceptional cases, please contact our support team at <a href="mailto:support@buddytourguide.com" className="text-primary hover:underline">support@buddytourguide.com</a>.
      </p>
    </div>
  );
}
