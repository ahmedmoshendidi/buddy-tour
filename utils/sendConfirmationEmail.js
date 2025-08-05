const axios = require('axios');

const sendConfirmationEmail = async (email, firstName, lastName, bookingData) => {
  try {
    const response = await axios.post('https://api.mailersend.com/v1/email', {
      from: {
        email: process.env.MAILERSEND_SENDER_EMAIL,
        name: "Buddy Tour"
      },
      to: [
        {
          email,
          name: `${firstName} ${lastName}`
        }
      ],
      template_id: process.env.MAILERSEND_TEMPLATE_ID,
      variables: [
        {
          email,
          substitutions: [
            { var: "firstName", value: firstName },
            { var: "lastName", value: lastName },
            { var: "tourTitle", value: bookingData.tourTitle },
            { var: "date", value: bookingData.date },
            { var: "time", value: bookingData.time },
            { var: "adults", value: bookingData.adults.toString() },
            { var: "children", value: bookingData.children.toString() },
            { var: "amount", value: bookingData.amount.toFixed(2) }
          ]
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
