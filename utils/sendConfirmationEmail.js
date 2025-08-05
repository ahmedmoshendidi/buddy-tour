const axios = require("axios");

/**
 * Send template confirmation email
 * @param {string} email - Customer's email address
 * @param {string} subject - Email subject line
 * @param {object} variables - Variables to fill in the template
 */
const sendConfirmationEmail = async (email, subject, variables) => {
  try {
    const response = await axios.post("https://api.mailersend.com/v1/email", {
      from: {
        email: process.env.MAILERSEND_SENDER_EMAIL,
        name: "Buddy Tour"
      },
      to: [
        {
          email,
          name: `${variables.firstName} ${variables.lastName}`
        }
      ],
      subject: subject,
      template_id: process.env.MAILERSEND_TEMPLATE_ID,
      variables: [
        {
          email,
          substitutions: Object.entries(variables).map(([key, value]) => ({
            var: key,
            value: String(value)
          }))
        }
      ]
    }, {
      headers: {
        Authorization: `Bearer ${process.env.MAILERSEND_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Template email sent to:', email);
  } catch (err) {
    console.error('❌ Error sending template email:', err.response?.data || err.message);
  }
};

module.exports = sendConfirmationEmail;
