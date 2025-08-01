const axios = require('axios');

/**
 * Send confirmation email to the customer
 * @param {string} email - Customer's email address
 * @param {string} fullName - Customer's full name
 * @param {number} orderId - Related Paymob order ID
 * @param {number} amount - Paid amount in EGP
 */
const sendConfirmationEmail = async (email, fullName, orderId, amount) => {
  try {
    const response = await axios.post('https://api.mailersend.com/v1/email', {
      from: {
        email: "noreply@test-xkjn41m7yy04z781.mlsender.net", // استخدم test domain أو verified domain
        name: "Buddy Tour"
      },
      to: [
        {
          email,
          name: fullName
        }
      ],
      subject: "Booking Confirmation",
      text: `Hi ${fullName},\n\nThank you for booking your tour with Buddy Tour!\nOrder ID: ${orderId}\nAmount Paid: EGP ${amount}`,
      html: `<h3>Hi ${fullName},</h3><p>Thank you for booking your tour with <strong>Buddy Tour</strong>!</p><p>Order ID: <strong>${orderId}</strong></p><p>Amount Paid: <strong>EGP ${amount}</strong></p>`
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
