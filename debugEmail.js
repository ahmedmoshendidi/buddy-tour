require('dotenv').config(); // للتشغيل محلي فقط

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  try {
    const data = await resend.emails.send({
      from: process.env.MAIL_FROM,
      to: 'ahmedmoalshendidi@gmail.com', // جرّب على ايميلك
      subject: 'Test from BuddyTour via Resend',
      html: '<h1>🎉 It works!</h1><p>This is a test email via Resend API.</p>',
    });

    console.log('📨 Sent:', data);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
