const EmailService = require('./emailService');

/**
 * Send booking confirmation email
 * @param {string} email - Customer's email address
 * @param {string} subject - Email subject line
 * @param {object} variables - Variables to fill in the template
 */
const sendConfirmationEmail = async (email, subject, variables) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: bold; color: #059669; }
          .total { background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .success-badge { background: #dcfce7; color: #059669; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
            <div class="success-badge">Payment Successful</div>
          </div>
          
          <div class="content">
            <p>Dear ${variables.firstName} ${variables.lastName},</p>
            
            <p>Thank you for booking with BuddyTour! Your payment has been processed successfully and your tour is confirmed.</p>
            
            <div class="booking-details">
              <h3>📋 Booking Details</h3>
              
              <div class="detail-row">
                <span class="detail-label">Tour:</span>
                <span>${variables.tourTitle}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span>${variables.date}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span>${variables.time}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Adults:</span>
                <span>${variables.adults} person${variables.adults > 1 ? 's' : ''}</span>
              </div>
              
              ${variables.children > 0 ? `
              <div class="detail-row">
                <span class="detail-label">Children:</span>
                <span>${variables.children} child${variables.children > 1 ? 'ren' : ''}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="total">
              <h3>💰 Total Paid: ${variables.amount} EGP</h3>
            </div>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>🗓️ Save the date and time in your calendar</li>
              <li>📧 Keep this email as your booking confirmation</li>
              <li>📱 Our tour guide will contact you closer to the date with meeting details</li>
              <li>🎒 Prepare for an amazing tour experience!</li>
            </ul>
            
            <p>If you have any questions or need to make changes to your booking, please contact us as soon as possible.</p>
            
            <div class="footer">
              <p><strong>BuddyTour Team</strong><br>
              Your Local Tour Guide Platform</p>
              <p>📧 info@buddytourguide.com | 🌐 ${process.env.FRONTEND_URL || 'buddytourguide.com'}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Booking Confirmed - BuddyTour

Dear ${variables.firstName} ${variables.lastName},

Thank you for booking with BuddyTour! Your payment has been processed successfully.

Booking Details:
- Tour: ${variables.tourTitle}
- Date: ${variables.date}
- Time: ${variables.time}
- Adults: ${variables.adults}
${variables.children > 0 ? `- Children: ${variables.children}` : ''}
- Total Paid: ${variables.amount} EGP

What's Next:
- Save the date and time in your calendar
- Keep this email as your booking confirmation
- Our tour guide will contact you closer to the date with meeting details

If you have any questions, please contact us at info@buddytourguide.com

BuddyTour Team
${process.env.FRONTEND_URL || 'buddytourguide.com'}
    `;

    // Use the same EmailService transporter
    if (!EmailService.transporter) {
      console.log('📧 Email service not configured - skipping confirmation email');
      return;
    }

    const mailOptions = {
      from: `"BuddyTour" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    const info = await EmailService.transporter.sendMail(mailOptions);
    
    console.log(`📧 Booking confirmation sent to ${email}:`, info.messageId);
    
  } catch (error) {
    console.error('❌ Error sending booking confirmation email:', error.message);
  }
};

module.exports = sendConfirmationEmail;