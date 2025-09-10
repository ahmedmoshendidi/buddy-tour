// utils/emailService.js
const { Resend } = require('resend');

class EmailService {
  constructor() {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY is missing. Emails will fail to send.');
    }
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  getFromAddress() {
    // مثال: "BuddyTour <info@buddytourguide.com>"
    return process.env.MAIL_FROM || 'BuddyTour <no-reply@buddytourguide.com>';
  }

  // دالة إرسال عامة
  async send({ to, subject, html, text, replyTo }) {
    if (!this.resend) throw new Error('Resend client not initialized');

    const payload = {
      from: this.getFromAddress(),
      to,
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    };

    try {
      const res = await this.resend.emails.send(payload);
      console.log('📨 Resend sent:', res?.id || 'ok');
      return { success: true, id: res?.id || null };
    } catch (e) {
      console.error('❌ Resend error:', e.message || e);
      return { success: false, error: e.message || String(e) };
    }
  }

  // للتأكد بسرعة إن الـ API Key شغال والدومين Verified
  async testConnection() {
    try {
      const who = process.env.ADMIN_EMAIL || 'postmaster@buddytourguide.com';
      const r = await this.send({
        to: who,
        subject: 'BuddyTour | Resend connectivity test',
        text: 'If you received this, Resend API is working.',
        html: '<p>If you received this, <b>Resend API</b> is working.</p>',
      });
      return r.success
        ? { success: true, message: 'Resend connected and email sent.' }
        : { success: false, message: r.error || 'Unknown error' };
    } catch (e) {
      return { success: false, message: e.message || String(e) };
    }
  }

  // === قوالب جاهزة ===

  async sendNewApplicationNotification(application) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@buddytourguide.com';
    const subject = `New Tour Guide Application - ${application.fullName}`;

    const html = `
      <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:auto">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:20px;border-radius:8px 8px 0 0">
          <h1>🎯 New Tour Guide Application</h1>
          <p>A new application has been submitted to BuddyTour</p>
        </div>
        <div style="background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px">
          <h2>Application Details</h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin:20px 0">
            ${[
              ['Applicant Name', application.fullName],
              ['Email', application.email],
              ['Phone', application.phone],
              ['City', application.currentCity],
              ['Age', `${application.age} years old`],
              ['Education', application.educationLevel],
            ]
              .map(
                ([label, value]) => `
              <div style="background:#fff;padding:15px;border-radius:6px;border-left:4px solid #667eea">
                <div style="font-weight:bold;color:#667eea;font-size:12px;text-transform:uppercase">${label}</div>
                <div style="margin-top:6px">${value || '-'}</div>
              </div>`
              )
              .join('')}
          </div>

          <div style="background:#fff;padding:15px;border-radius:6px;border-left:4px solid #667eea;margin:10px 0">
            <div style="font-weight:bold;color:#667eea;font-size:12px;text-transform:uppercase">Languages</div>
            <div style="margin-top:6px">
              ${(application.languages || [])
                .map(
                  (x) =>
                    `<span style="display:inline-block;background:#e0e7ff;color:#3730a3;padding:4px 8px;border-radius:12px;font-size:12px;margin:2px">${x}</span>`
                )
                .join('')}
            </div>
          </div>

          <div style="background:#fff;padding:15px;border-radius:6px;border-left:4px solid #667eea;margin:10px 0">
            <div style="font-weight:bold;color:#667eea;font-size:12px;text-transform:uppercase">Preferred Cities</div>
            <div style="margin-top:6px">
              ${(application.preferredCities || [])
                .map(
                  (x) =>
                    `<span style="display:inline-block;background:#e0e7ff;color:#3730a3;padding:4px 8px;border-radius:12px;font-size:12px;margin:2px">${x}</span>`
                )
                .join('')}
            </div>
          </div>

          <div style="background:#fff;padding:15px;border-radius:6px;border-left:4px solid #667eea;margin:10px 0">
            <div style="font-weight:bold;color:#667eea;font-size:12px;text-transform:uppercase">Tour Types</div>
            <div style="margin-top:6px">
              ${(application.tourTypes || [])
                .map(
                  (x) =>
                    `<span style="display:inline-block;background:#e0e7ff;color:#3730a3;padding:4px 8px;border-radius:12px;font-size:12px;margin:2px">${x}</span>`
                )
                .join('')}
            </div>
          </div>

          <div style="background:#fff;padding:15px;border-radius:6px;border-left:4px solid #667eea;margin:10px 0">
            <div style="font-weight:bold;color:#667eea;font-size:12px;text-transform:uppercase">Motivation</div>
            <div style="margin-top:6px">${application.motivation || '-'}</div>
          </div>

          <div style="background:#fff;padding:15px;border-radius:6px;border-left:4px solid #667eea;margin:10px 0">
            <div style="font-weight:bold;color:#667eea;font-size:12px;text-transform:uppercase">Unique Value</div>
            <div style="margin-top:6px">${application.uniqueValue || '-'}</div>
          </div>

          <div style="text-align:center;margin:24px 0">
            <a href="${process.env.FRONTEND_URL || 'https://buddytourguide.com'}/admin-dashboard"
               style="background:#667eea;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">
               Review Application in Dashboard
            </a>
          </div>
        </div>
      </div>`;

    const text = `New Tour Guide Application

Name: ${application.fullName}
Email: ${application.email}
Phone: ${application.phone}
City: ${application.currentCity}
Age: ${application.age}
Education: ${application.educationLevel}

Languages: ${(application.languages || []).join(', ')}
Preferred Cities: ${(application.preferredCities || []).join(', ')}
Tour Types: ${(application.tourTypes || []).join(', ')}

Motivation: ${application.motivation}
Unique Value: ${application.uniqueValue}

Dashboard: ${(process.env.FRONTEND_URL || 'https://buddytourguide.com') + '/admin-dashboard'}
`;

    return this.send({ to: adminEmail, subject, html, text });
  }

  async sendApplicationStatusUpdate(application, newStatus, adminMessage = '') {
    const statusMessages = {
      approved: {
        subject: '🎉 Your Tour Guide Application Has Been Approved!',
        title: 'Congratulations! Your application has been approved',
        message:
          'We are excited to welcome you to the BuddyTour family! Your expertise and passion for sharing local culture will be a valuable addition to our platform.',
        nextSteps:
          'Our team will contact you within 2-3 business days to complete the onboarding process and set up your guide profile.',
        color: '#10b981',
        color2: '#059669',
      },
      rejected: {
        subject: 'Update on Your Tour Guide Application',
        title: 'Application Status Update',
        message:
          'Thank you for your interest in becoming a tour guide with BuddyTour. After careful review, we have decided not to move forward with your application at this time.',
        nextSteps:
          'We encourage you to apply again in the future as our requirements may evolve. Thank you for your time and interest in BuddyTour.',
        color: '#6b7280',
        color2: '#4b5563',
      },
    };

    const s = statusMessages[newStatus];
    if (!s) throw new Error(`Unknown status: ${newStatus}`);

    const html = `
      <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:auto">
        <div style="background:linear-gradient(135deg, ${s.color} , ${s.color2});color:#fff;padding:20px;border-radius:8px 8px 0 0;text-align:center">
          <h1>${s.title}</h1>
          <div style="display:inline-block;background:#fff;color:#111;padding:6px 12px;border-radius:16px;font-weight:bold">Status: ${newStatus[0].toUpperCase() + newStatus.slice(1)}</div>
        </div>
        <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px">
          <p>Dear ${application.fullName},</p>
          <div style="background:#fff;padding:16px;border-left:4px solid ${s.color};border-radius:8px">
            <p>${s.message}</p>
            ${adminMessage ? `<p><strong>Additional Message:</strong> ${adminMessage}</p>` : ''}
          </div>
          <p style="margin-top:16px"><strong>Next Steps:</strong> ${s.nextSteps}</p>
          ${
            newStatus === 'approved'
              ? `<div style="text-align:center;margin:24px 0">
                   <a href="${process.env.FRONTEND_URL || 'https://buddytourguide.com'}"
                      style="background:${s.color};color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">Visit BuddyTour</a>
                 </div>`
              : ''
          }
          <p style="color:#666">If you have any questions, please don't hesitate to contact us.</p>
          <p><strong>BuddyTour Team</strong><br/>Your Local Tour Guide Platform</p>
        </div>
      </div>`;

    return this.send({
      to: application.email,
      subject: s.subject,
      html,
      text: `${s.title}\n\n${s.message}\n${adminMessage ? `\nNote: ${adminMessage}` : ''}\n\nNext steps: ${s.nextSteps}`,
    });
  }
}

module.exports = new EmailService();
