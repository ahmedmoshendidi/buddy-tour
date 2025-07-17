const axios = require('axios');

/**
 * Send confirmation email to the customer
 * @param {string} email - Customer's email address
 * @param {string} firstName - Customer's first name
 */
const sendConfirmationEmail = async (email, firstName) => {
  try {
    const response = await axios.post('https://api.mailersend.com/v1/email', {
      from: {
        email: "noreply@test-xkjn41m7yy04z781.mlsender.net", // استخدم test domain أو verified domain
        name: "Buddy Tour"
      },
      to: [
        {
          email,
          name: firstName
        }
      ],
      subject: "Booking Confirmation",
      text: `Hi ${firstName},\n\nThank you for booking your tour with Buddy Tour!`,
      html: `<h3>Hi ${firstName},</h3><p>Thank you for booking your tour with <strong>Buddy Tour</strong>!</p>`
    }, {
      headers: {
        Authorization: `Bearer ${process.env.MAILERSEND_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Email sent to:', email);
  } catch (err) {
    console.error('❌ Error sending email:', err.response?.data || err.message);
  }
};

module.exports = sendConfirmationEmail;
