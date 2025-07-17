const axios = require('axios');
require('dotenv').config();

const sendConfirmationEmail = async () => {
  try {
    const response = await axios.post(
      'https://api.mailersend.com/v1/email',
      {
        from: {
          email: "noreply@test-xkjn41m7yy04z781.mlsender.net",
          name: "Buddy Tour"
        },
        to: [
          {
            email: "ahmedmoalshendidi@gmail.com", // غيّر ده لإيميلك الفعلي
            name: "Test User"
          }
        ],
        subject: "Testing MailerSend",
        text: "This is a test email from Buddy Tour app.",
        html: "<h1>This is a test email</h1><p>Sent from Buddy Tour app.</p>"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MAILERSEND_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("✅ Test email sent successfully.");
  } catch (err) {
    console.error("❌ Error sending email:", err.response?.data || err.message);
  }
};

sendConfirmationEmail();
