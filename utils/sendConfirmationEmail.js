const EmailService = require('./emailService');

module.exports = async function sendConfirmationEmail(email, subject, variables) {
  const html = `
    <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:auto">
      <div style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:20px;border-radius:8px 8px 0 0;text-align:center">
        <h1>🎉 Booking Confirmed!</h1>
        <div style="display:inline-block;background:#dcfce7;color:#059669;padding:6px 12px;border-radius:16px;font-weight:bold;margin-top:8px">Payment Successful</div>
      </div>
      <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px">
        <p>Dear ${variables.firstName} ${variables.lastName},</p>
        <p>Thank you for booking with BuddyTour! Your payment has been processed successfully and your tour is confirmed.</p>

        <div style="background:#fff;padding:16px;border-left:4px solid #10b981;border-radius:8px;margin:16px 0">
          <h3>📋 Booking Details</h3>
          <p><b>Tour:</b> ${variables.tourTitle}</p>
          <p><b>Date:</b> ${variables.date}</p>
          <p><b>Time:</b> ${variables.time}</p>
          <p><b>Adults:</b> ${variables.adults}</p>
          ${variables.children > 0 ? `<p><b>Children:</b> ${variables.children}</p>` : ''}
        </div>

        <div style="background:#dcfce7;padding:16px;border-radius:8px;text-align:center;margin:16px 0">
          <h3>💰 Total Paid: ${variables.amount} EGP</h3>
        </div>

        <p><strong>What's Next?</strong></p>
        <ul>
          <li>🗓️ Save the date and time in your calendar</li>
          <li>📧 Keep this email as your booking confirmation</li>
          <li>📱 Our tour guide will contact you closer to the date with meeting details</li>
        </ul>

        <p style="color:#666">BuddyTour Team<br/>${process.env.FRONTEND_URL || 'https://buddytourguide.com'}</p>
      </div>
    </div>`;

  const text = `Booking Confirmed - BuddyTour
Tour: ${variables.tourTitle}
Date: ${variables.date} - ${variables.time}
Adults: ${variables.adults}${variables.children > 0 ? ` | Children: ${variables.children}` : ''}
Total Paid: ${variables.amount} EGP
`;

  try {
    await EmailService.send({ to: email, subject, html, text });
    console.log(`📧 Booking confirmation sent to ${email}`);
  } catch (e) {
    console.error('❌ Error sending booking confirmation email:', e.message);
  }
};
