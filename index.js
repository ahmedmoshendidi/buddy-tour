const express = require("express");
const cors = require("cors");
const path = require("path");
const paymentRoutes = require("./routes/paymentRoutes");
require('dotenv').config(); // في index.js أو server.js


const app = express();

// Serve static HTML files
app.use(express.static(path.join(__dirname)));

app.use(cors());
app.use(express.json());

app.use("/api", paymentRoutes);

// 🔁 تأكيد تقديم صفحات الشكر/الفشل عند الطلب المباشر
app.get("/success.html", (req, res) => {
  res.sendFile(path.join(__dirname, "success.html"));
});

app.get("/fail.html", (req, res) => {
  res.sendFile(path.join(__dirname, "fail.html"));
});

app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
});
