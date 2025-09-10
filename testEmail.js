const sendConfirmationEmail = require("./utils/sendConfirmationEmail");

// Test booking confirmation email with proper parameters
const testVariables = {
  firstName: "Ahmed",
  lastName: "Test",
  tourTitle: "Alexandria Walking Tour",
  date: "2024-12-15",
  time: "10:00 AM",
  adults: 2,
  children: 1,
  amount: 150
};

sendConfirmationEmail("ahmedmoalshendidi@gmail.com", "Booking Confirmation - Test", testVariables)
  .then(() => {
    console.log("✅ Booking confirmation email sent successfully!");
  })
  .catch((err) => {
    console.error("❌ Failed to send confirmation email:", err.message);
  });
