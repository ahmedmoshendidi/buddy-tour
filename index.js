const express = require("express");
const cors = require("cors");
const path = require("path");
const paymentRoutes = require("./routes/paymentRoutes");
require('dotenv').config(); // تحميل env variables

const app = express();

// تحديد البورت
const PORT = process.env.PORT || 5000;

// إعدادات السيرفر
app.use(cors());
app.use(express.json());

// تقديم ملفات static زي success.html / fail.html
app.use(express.static(path.join(__dirname)));

// المسارات الخاصة بالدفع
app.use("/api", paymentRoutes);

// مسارات صفحات النجاح والفشل
app.get("/success.html", (req, res) => {
  res.sendFile(path.join(__dirname, "success.html"));
});

app.get("/fail.html", (req, res) => {
  res.sendFile(path.join(__dirname, "fail.html"));
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
