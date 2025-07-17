const sendConfirmationEmail = require("./utils/sendConfirmationEmail");

sendConfirmationEmail("ahmedmoalshendidi@gmail.com", "Ahmed")
  .then(() => {
    console.log("✅ Test email sent successfully.");
  })
  .catch((err) => {
    console.error("❌ Failed to send test email:", err.response?.data || err.message);
  });
