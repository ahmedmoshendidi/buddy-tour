const sendConfirmationEmail = require("./utils/sendConfirmationEmail");

sendConfirmationEmail("ahmedmoalshendidi@gmail.com", "Ahmed Test", 12345, 100)
  .then(() => {
    console.log("✅ Test email sent successfully.");
  })
  .catch((err) => {
    console.error("❌ Failed to send test email:", err.response?.data || err.message);
  });
