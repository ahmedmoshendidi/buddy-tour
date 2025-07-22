const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const sendConfirmationEmail = require("../utils/sendConfirmationEmail");
require("dotenv").config();

const router = express.Router();

// إعدادات Paymob من ملف البيئة
const {
  PAYMOB_API_KEY,
  PAYMOB_INTEGRATION_ID,
  PAYMOB_IFRAME_ID,
  PAYMOB_HMAC_SECRET,
  ADMIN_EMAIL = "ahmedmoalshendidi@gmail.com",
  FRONTEND_URL = "http://localhost:3000" // قيمة افتراضية للتطوير
} = process.env;

// تخزين مؤقت لحالات الدفع
const paymentStatus = new Map();

// ============== Middleware محسّن للتحقق من HMAC ==============
function verifyHMAC(req, res, next) {
  if (!PAYMOB_HMAC_SECRET) {
    console.warn('⚠️ HMAC secret not configured, skipping verification');
    return next();
  }

  try {
    const receivedHash = req.query.hmac || req.headers['x-paymob-signature'];
    if (!receivedHash) {
      return res.status(403).json({ error: "Missing HMAC signature" });
    }

    const data = req.method === 'GET' 
      ? Object.entries(req.query)
          .filter(([key]) => key !== 'hmac')
          .sort()
          .toString() 
      : JSON.stringify(req.body);

    const generatedHash = crypto
      .createHmac('sha512', PAYMOB_HMAC_SECRET)
      .update(data)
      .digest('hex');

    if (receivedHash !== generatedHash) {
      console.error('❌ HMAC verification failed', {
        received: receivedHash,
        generated: generatedHash
      });
      return res.status(403).json({ error: "Invalid HMAC signature" });
    }

    next();
  } catch (error) {
    console.error('❌ HMAC verification error:', error);
    res.status(500).json({ error: "HMAC verification failed" });
  }
}

// ============== Routes محسنة مع معالجة أخطاء شاملة ==============
router.post("/initiate", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, amount = 500 } = req.body;

    // تحقق متقدم من البيانات
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["firstName", "lastName", "email", "phone"]
      });
    }

    if (isNaN(amount) || amount < 1) {
      return res.status(400).json({ 
        error: "Invalid amount",
        message: "Amount must be a positive number"
      });
    }

    const billingData = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: phone,
      city: "Cairo",
      country: "EG"
    };

    // 1. الحصول على token من Paymob
    const authResponse = await axios.post(
      "https://accept.paymob.com/api/auth/tokens",
      { api_key: PAYMOB_API_KEY },
      { timeout: 5000 }
    );

    // 2. إنشاء طلب
    const orderResponse = await axios.post(
      "https://accept.paymob.com/api/ecommerce/orders",
      {
        auth_token: authResponse.data.token,
        delivery_needed: false,
        amount_cents: Math.round(amount * 100),
        currency: "EGP",
        items: []
      },
      { timeout: 5000 }
    );

    // 3. إنشاء مفتاح دفع
    const paymentKeyResponse = await axios.post(
      "https://accept.paymob.com/api/acceptance/payment_keys",
      {
        auth_token: authResponse.data.token,
        amount_cents: Math.round(amount * 100),
        expiration: 3600,
        order_id: orderResponse.data.id,
        billing_data: billingData,
        currency: "EGP",
        integration_id: PAYMOB_INTEGRATION_ID
      },
      { timeout: 5000 }
    );

    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKeyResponse.data.token}`;
    
    // حفظ حالة الدفع
    paymentStatus.set(orderResponse.data.id.toString(), {
      status: "pending",
      iframeUrl,
      createdAt: new Date(),
      amount,
      customer: { firstName, lastName, email, phone }
    });

    res.json({ 
      success: true,
      iframeUrl,
      orderId: orderResponse.data.id,
      message: "Payment initiated successfully"
    });

  } catch (error) {
    console.error("❌ Payment initiation failed:", {
      error: error.response?.data || error.message,
      stack: error.stack
    });

    const statusCode = error.response?.status || 500;
    res.status(statusCode).json({ 
      success: false,
      error: "Payment initiation failed",
      details: process.env.NODE_ENV === 'development' 
        ? error.message 
        : undefined
    });
  }
});

// ============== Callbacks محسنة مع التحقق المزدوج ==============
router.all("/callback", verifyHMAC, async (req, res) => {
  try {
    const { order, success, pending, id } = req.method === 'GET' ? req.query : req.body.obj || {};
    const orderId = (order?.id || id)?.toString();

    if (!orderId) {
      return res.status(400).json({ error: "Missing order ID" });
    }

    const isSuccess = success === 'true' || success === true;
    const isPending = pending === 'true' || pending === true;

    if (isSuccess && !isPending) {
      const orderData = paymentStatus.get(orderId) || {};
      
      paymentStatus.set(orderId, { 
        ...orderData,
        status: "completed",
        completedAt: new Date(),
        paymentMethod: req.body.obj?.payment_method || req.query.payment_method
      });

      // إرسال إيميل التأكيد
      try {
        await sendConfirmationEmail(
          orderData.customer?.email || ADMIN_EMAIL,
          orderData.customer?.firstName || "Customer",
          orderId,
          orderData.amount
        );
      } catch (emailError) {
        console.error("❌ Failed to send confirmation email:", emailError);
      }

      return res.status(200).json({ status: "completed" });
    }

    res.status(200).json({ status: "pending" });

  } catch (error) {
    console.error("❌ Callback processing failed:", error);
    res.status(500).json({ error: "Callback processing failed" });
  }
});

// ============== Route لفحص حالة الدفع مع تحسينات ==============
router.get("/status/:orderId", (req, res) => {
  try {
    const order = paymentStatus.get(req.params.orderId);
    if (!order) {
      return res.status(404).json({ 
        error: "Order not found",
        suggestion: "Check the order ID or verify if payment was initiated"
      });
    }

    // إذا كانت العملية معلقة لأكثر من ساعة
    if (order.status === "pending" && 
        new Date() - new Date(order.createdAt) > 3600000) {
      order.status = "expired";
    }

    res.json({
      status: order.status,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      amount: order.amount,
      customer: order.customer
    });

  } catch (error) {
    console.error("❌ Payment status check failed:", error);
    res.status(500).json({ error: "Failed to check payment status" });
  }
});

module.exports = router;