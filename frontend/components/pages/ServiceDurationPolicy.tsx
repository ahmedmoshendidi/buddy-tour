import React from 'react';

export default function ServiceDurationPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-semibold mb-6 text-primary">
        Service Duration Policy
      </h1>

      <p className="text-muted-foreground mb-4">
        Once you complete your booking and payment on <strong>BuddyTour</strong>,
        you will receive a confirmation email instantly.
      </p>

      <p className="text-muted-foreground mb-4">
        Our walking tours are scheduled services — each tour takes place on the
        selected date and time shown on the tour page.
      </p>

      <p className="text-muted-foreground mb-4">
        You can access all your booking details in the confirmation email and
        through our support team if needed.
      </p>

      <p className="text-muted-foreground mb-4">
        If a tour is canceled by the guide or due to unforeseen circumstances
        (e.g. weather conditions), you will be notified immediately and offered
        an alternative date or a full refund.
      </p>

      <p className="text-muted-foreground mt-8">
        For more information or assistance, please contact us at{' '}
        <a
          href="mailto:support@buddytourguide.com"
          className="text-primary hover:underline"
        >
          support@buddytourguide.com
        </a>
        .
      </p>
    </div>
  );
}
