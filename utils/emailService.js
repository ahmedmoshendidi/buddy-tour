const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Create transporter based on environment
    if (process.env.EMAIL_SERVICE === 'gmail') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD // Use App Password for Gmail
        }
      });
    } else if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      console.warn('⚠️ Email service not configured. Set EMAIL_SERVICE or SMTP_* environment variables.');
    }
  }

  async sendNewApplicationNotification(application) {
    if (!this.transporter) {
      console.log('📧 Email service not configured - skipping notification');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@buddytourguide.com';
      const subject = `New Tour Guide Application - ${application.fullName}`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .info-item { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; }
            .info-label { font-weight: bold; color: #667eea; font-size: 12px; text-transform: uppercase; }
            .info-value { margin-top: 5px; }
            .badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin: 2px; }
            .cta-button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Tour Guide Application</h1>
              <p>A new application has been submitted to BuddyTour</p>
            </div>
            
            <div class="content">
              <h2>Application Details</h2>
              
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Applicant Name</div>
                  <div class="info-value">${application.fullName}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value">${application.email}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Phone</div>
                  <div class="info-value">${application.phone}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">City</div>
                  <div class="info-value">${application.currentCity}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Age</div>
                  <div class="info-value">${application.age} years old</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Education</div>
                  <div class="info-value">${application.educationLevel}</div>
                </div>
              </div>
              
              <div class="info-item" style="grid-column: 1 / -1;">
                <div class="info-label">Languages</div>
                <div class="info-value">
                  ${application.languages.map(lang => `<span class="badge">${lang}</span>`).join('')}
                </div>
              </div>
              
              <div class="info-item" style="grid-column: 1 / -1;">
                <div class="info-label">Preferred Cities</div>
                <div class="info-value">
                  ${application.preferredCities.map(city => `<span class="badge">${city}</span>`).join('')}
                </div>
              </div>
              
              <div class="info-item" style="grid-column: 1 / -1;">
                <div class="info-label">Tour Types</div>
                <div class="info-value">
                  ${application.tourTypes.map(type => `<span class="badge">${type}</span>`).join('')}
                </div>
              </div>
              
              <div class="info-item" style="grid-column: 1 / -1;">
                <div class="info-label">Motivation</div>
                <div class="info-value">${application.motivation}</div>
              </div>
              
              <div class="info-item" style="grid-column: 1 / -1;">
                <div class="info-label">Unique Value</div>
                <div class="info-value">${application.uniqueValue}</div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/admin-dashboard" class="cta-button">
                  Review Application in Dashboard
                </a>
              </div>
              
              <div class="footer">
                <p>This notification was sent automatically when a new tour guide application was submitted.</p>
                <p><strong>BuddyTour</strong> - Your Local Tour Guide Platform</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
New Tour Guide Application Submitted

Applicant: ${application.fullName}
Email: ${application.email}
Phone: ${application.phone}
City: ${application.currentCity}
Age: ${application.age}
Education: ${application.educationLevel}

Languages: ${application.languages.join(', ')}
Preferred Cities: ${application.preferredCities.join(', ')}
Tour Types: ${application.tourTypes.join(', ')}

Motivation: ${application.motivation}
Unique Value: ${application.uniqueValue}

Review this application at: ${process.env.FRONTEND_URL}/admin-dashboard
      `;

      const mailOptions = {
        from: `"BuddyTour Notifications" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: subject,
        text: textContent,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('📧 New application notification sent:', info.messageId);
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      console.error('📧 Failed to send email notification:', error);
      return { success: false, error: error.message };
    }
  }

  async sendApplicationStatusUpdate(application, newStatus, adminMessage = '') {
    if (!this.transporter) {
      console.log('📧 Email service not configured - skipping status notification');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const statusMessages = {
        approved: {
          subject: '🎉 Your Tour Guide Application Has Been Approved!',
          title: 'Congratulations! Your application has been approved',
          message: 'We are excited to welcome you to the BuddyTour family! Your expertise and passion for sharing local culture will be a valuable addition to our platform.',
          nextSteps: 'Our team will contact you within 2-3 business days to complete the onboarding process and set up your guide profile.'
        },
        rejected: {
          subject: 'Update on Your Tour Guide Application',
          title: 'Application Status Update',
          message: 'Thank you for your interest in becoming a tour guide with BuddyTour. After careful review, we have decided not to move forward with your application at this time.',
          nextSteps: 'We encourage you to apply again in the future as our requirements may evolve. Thank you for your time and interest in BuddyTour.'
        }
      };

      const statusInfo = statusMessages[newStatus];
      if (!statusInfo) {
        throw new Error(`Unknown status: ${newStatus}`);
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${newStatus === 'approved' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .status-badge { background: ${newStatus === 'approved' ? '#dcfce7' : '#f3f4f6'}; color: ${newStatus === 'approved' ? '#059669' : '#6b7280'}; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 20px 0; }
            .message-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${newStatus === 'approved' ? '#10b981' : '#6b7280'}; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .cta-button { background: ${newStatus === 'approved' ? '#10b981' : '#6b7280'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${statusInfo.title}</h1>
              <div class="status-badge">Status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</div>
            </div>
            
            <div class="content">
              <p>Dear ${application.fullName},</p>
              
              <div class="message-box">
                <p>${statusInfo.message}</p>
                ${adminMessage ? `<p><strong>Additional Message:</strong> ${adminMessage}</p>` : ''}
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <p>${statusInfo.nextSteps}</p>
              
              ${newStatus === 'approved' ? `
                <div style="text-align: center;">
                  <a href="${process.env.FRONTEND_URL}" class="cta-button">
                    Visit BuddyTour
                  </a>
                </div>
              ` : ''}
              
              <div class="footer">
                <p>If you have any questions, please don't hesitate to contact us.</p>
                <p><strong>BuddyTour Team</strong><br>
                Your Local Tour Guide Platform</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"BuddyTour Team" <${process.env.SMTP_USER}>`,
        to: application.email,
        subject: statusInfo.subject,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`📧 Application ${newStatus} notification sent to ${application.email}:`, info.messageId);
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      console.error('📧 Failed to send status update email:', error);
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    if (!this.transporter) {
      return { success: false, message: 'Email service not configured' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service connected successfully' };
    } catch (error) {
      return { success: false, message: `Email connection failed: ${error.message}` };
    }
  }
}

module.exports = new EmailService();