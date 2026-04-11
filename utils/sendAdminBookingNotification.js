const EmailService = require('./emailService');

module.exports = async function sendAdminBookingNotification(variables) {
  const adminEmail = process.env.ADMIN_EMAIL || 'info@buddytourguide.com';
  const subject = `🎉 New Booking Alert: ${variables.tourTitle}`;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:auto">
      <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:20px;border-radius:8px 8px 0 0;text-align:center">
        <h1>New Booking Received!</h1>
      </div>
      <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px">
        <p>Hello Admin,</p>
        <p>A new booking has been successfully paid and confirmed.</p>

        <div style="background:#fff;padding:16px;border-left:4px solid #667eea;border-radius:8px;margin:16px 0">
          <h3>Customer Details</h3>
          <p><b>Name:</b> ${variables.firstName} ${variables.lastName}</p>
          <p><b>Email:</b> ${variables.email}</p>
          <p><b>Phone:</b> ${variables.phone}</p>
          <p><b>Nationality:</b> ${variables.nationality}</p>
        </div>

        <div style="background:#fff;padding:16px;border-left:4px solid #10b981;border-radius:8px;margin:16px 0">
          <h3>Booking Details</h3>
          <p><b>Tour:</b> ${variables.tourTitle}</p>
          <p><b>Date:</b> ${variables.date}</p>
          <p><b>Time:</b> ${variables.time}</p>
          <p><b>Adults:</b> ${variables.adults}</p>
          ${variables.children > 0 ? `<p><b>Children:</b> ${variables.children}</p>` : ''}
          <p><b>Total Paid:</b> ${variables.amount} EGP</p>
        </div>

        <p style="color:#666;text-align:center;margin-top:20px">BuddyTour System</p>
      </div>
    </div>`;

  const text = `New Booking Alert\n\nTour: ${variables.tourTitle}\nCustomer: ${variables.firstName} ${variables.lastName}\nEmail: ${variables.email}\nPhone: ${variables.phone}\nDate: ${variables.date} - ${variables.time}\nAmount Paid: ${variables.amount} EGP`;

  try {
    await EmailService.send({ to: adminEmail, subject, html, text });
    console.log('📧 Admin booking notification sent.');
  } catch (e) {
    console.error('❌ Error sending admin booking notification email:', e.message);
  }
};
