// index.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const paymentRoutes = require("./routes/paymentRoutes");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// تقديم ملفات static (index.html, success.html, fail.html)
app.use(express.static(path.join(__dirname)));

// مسارات API للدفع
app.use("/api", paymentRoutes);

// مسارات صريحة لصفحات النجاح والفشل
app.get("/success.html", (req, res) => {
  res.sendFile(path.join(__dirname, "success.html"));
});

app.get("/fail.html", (req, res) => {
  res.sendFile(path.join(__dirname, "fail.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
