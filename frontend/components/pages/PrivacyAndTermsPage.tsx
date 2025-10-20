import React, { useState } from "react";

export default function PrivacyAndTermsPage() {
  const [tab, setTab] = useState("privacy"); // "privacy" | "terms"
  const [lang, setLang] = useState("en"); // "en" | "ar"

  const supportEmail = "support@buddytourguide.com";
  const lastUpdated = "October 2025";
  const paymobPolicy = "https://paymob.com/ar/policy";

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">Buddytourguide</h1>
            <p className="text-sm text-gray-500">Privacy Policy & Terms — <span className="font-medium">Last updated:</span> {lastUpdated}</p>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <div className="inline-flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTab("privacy")}
                className={`px-3 py-1 rounded-lg text-sm ${tab === "privacy" ? "bg-white shadow" : "text-gray-600"}`}>
                Privacy Policy
              </button>
              <button
                onClick={() => setTab("terms")}
                className={`px-3 py-1 rounded-lg text-sm ${tab === "terms" ? "bg-white shadow" : "text-gray-600"}`}>
                Terms & Conditions
              </button>
            </div>

            <div className="inline-flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button onClick={() => setLang("en")} className={`px-3 py-1 rounded-lg text-sm ${lang === "en" ? "bg-white shadow" : "text-gray-600"}`}>EN</button>
              <button onClick={() => setLang("ar")} className={`px-3 py-1 rounded-lg text-sm ${lang === "ar" ? "bg-white shadow" : "text-gray-600"}`}>AR</button>
            </div>
          </div>
        </header>

        <main className="p-6 md:p-10">
          {tab === "privacy" && lang === "en" && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Privacy Policy</h2>
              <p className="text-sm text-gray-600 mb-4">Welcome to <span className="font-medium">Buddytourguide</span> ("we", "our", "us"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and protect your information when you use our website <span className="font-medium">buddytourguide.com</span>.</p>

              <h3 className="font-semibold mt-6">1. Information We Collect</h3>
              <ul className="list-disc ml-6 text-gray-700">
                <li>Name, email address, phone number, and country.</li>
                <li>Usage data: pages visited and interactions on the platform.</li>
                <li>Cookies and analytics for improving experience and performance.</li>
              </ul>

              <h3 className="font-semibold mt-6">2. Payment Processing</h3>
              <p className="text-gray-700">We do not collect or store payment card details directly. All payments are processed by our trusted payment provider <a className="text-blue-600 underline" href={paymobPolicy} target="_blank" rel="noreferrer">Paymob</a>. Please review Paymob’s privacy policy for details about how they handle payment data.</p>

              <h3 className="font-semibold mt-6">3. How We Use Your Data</h3>
              <ul className="list-disc ml-6 text-gray-700">
                <li>To match tourists with tour guides and enable bookings.</li>
                <li>To communicate booking confirmations, updates and service messages.</li>
                <li>To improve our services and analyze platform usage.</li>
                <li>To comply with legal obligations.</li>
              </ul>

              <h3 className="font-semibold mt-6">4. Sharing Your Data</h3>
              <p className="text-gray-700">We do not sell or rent user data. We may share limited information with tour guides or tourists to facilitate bookings, with Paymob for payment processing, and with analytics providers (e.g., Google Analytics) to improve the service.</p>

              <h3 className="font-semibold mt-6">5. GDPR (European Union)</h3>
              <p className="text-gray-700">If you are located in the EU, you have rights under the GDPR including access, correction, deletion, portability and the right to withdraw consent. To exercise these rights contact us at <a className="text-blue-600 underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>

              <h3 className="font-semibold mt-6">6. CCPA (California)</h3>
              <p className="text-gray-700">If you are a California resident, you have rights under the CCPA such as the right to know what data we collect, to request deletion, and to opt-out of sales (we do not sell data). Contact: <a className="text-blue-600 underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>

              <h3 className="font-semibold mt-6">7. Cookies</h3>
              <p className="text-gray-700">We use cookies to personalize and improve the website. You can disable cookies via your browser settings but that may affect functionality.</p>

              <h3 className="font-semibold mt-6">8. Data Security</h3>
              <p className="text-gray-700">We implement reasonable technical and organizational measures including HTTPS encryption and limited access to personal data. Financial data is handled by Paymob.</p>

              <h3 className="font-semibold mt-6">9. Updates</h3>
              <p className="text-gray-700">We may update this policy occasionally. Significant changes will be communicated via email or a prominent notice on the site.</p>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm">If you have questions or wish to exercise your rights, contact us at <a className="text-blue-600 underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
              </div>
            </section>
          )}

          {tab === "privacy" && lang === "ar" && (
            <section dir="rtl" className="text-right">
              <h2 className="text-xl font-semibold mb-4">سياسة الخصوصية</h2>
              <p className="text-sm text-gray-600 mb-4">مرحبًا بكم في <span className="font-medium">Buddytourguide</span>. نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمعنا واستخدامنا وحماية المعلومات عند استخدامك لموقعنا.</p>

              <h3 className="font-semibold mt-6">1. البيانات التي نجمعها</h3>
              <ul className="list-disc mr-6 text-gray-700">
                <li>الاسم، البريد الإلكتروني، رقم الهاتف، والدولة.</li>
                <li>بيانات الاستخدام: الصفحات التي تزورها والتفاعلات داخل المنصة.</li>
                <li>الكوكيز والتحليلات لتحسين تجربة المستخدم.</li>
              </ul>

              <h3 className="font-semibold mt-6">2. الدفع</h3>
              <p className="text-gray-700">لا نجمع أو نخزن بيانات البطاقات الائتمانية مباشرة. تُدار جميع المدفوعات عبر مزود الدفع <a className="text-blue-600 underline" href={paymobPolicy} target="_blank" rel="noreferrer">Paymob</a>. راجع سياسة Paymob لمزيد من التفاصيل.</p>

              <h3 className="font-semibold mt-6">3. استخدام البيانات</h3>
              <ul className="list-disc mr-6 text-gray-700">
                <li>لتسهيل المطابقة بين السائحين والمرشدين وتمكين الحجز.</li>
                <li>لإرسال تأكيدات الحجز والتحديثات والرسائل الخدمية.</li>
                <li>لتحسين الخدمة وتحليل استخدام المنصة.</li>
                <li>للالتزام بالمتطلبات القانونية.</li>
              </ul>

              <h3 className="font-semibold mt-6">4. مشاركة البيانات</h3>
              <p className="text-gray-700">لا نبيع بيانات المستخدمين. قد نشارك معلومات محدودة مع المرشدين أو السائحين المعنيين، ومع Paymob لمعالجة المدفوعات، ومع مزودي التحليلات لتحسين الخدمة.</p>

              <h3 className="font-semibold mt-6">5. حقوق الاتحاد الأوروبي (GDPR)</h3>
              <p className="text-gray-700">إذا كنت من دول الاتحاد الأوروبي، لديك حقوق مثل الوصول والتعديل والحذف ونقل البيانات وسحب الموافقة. لممارسة هذه الحقوق راسلنا على <a className="text-blue-600 underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>

              <h3 className="font-semibold mt-6">6. خصوصية سكان كاليفورنيا (CCPA)</h3>
              <p className="text-gray-700">إذا كنت مقيمًا في كاليفورنيا، يمكنك معرفة البيانات التي نجمعها وطلب حذفها ورفض أي بيع (نحن لا نبيع البيانات). اتصل بنا على <a className="text-blue-600 underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>

              <h3 className="font-semibold mt-6">7. الأمان</h3>
              <p className="text-gray-700">نطبق تدابير فنية وتنظيمية مناسبة مثل التشفير عبر HTTPS وتحديد صلاحيات الوصول. البيانات المالية تتم معالجتها عبر Paymob.</p>

              <h3 className="font-semibold mt-6">8. التحديثات</h3>
              <p className="text-gray-700">نحتفظ بالحق في تعديل سياسة الخصوصية وسنقوم بإخطار المستخدمين في حال حدوث تغييرات جوهرية.</p>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm">لأي استفسارات أو لممارسة حقوقك، تواصل معنا على <a className="text-blue-600 underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
              </div>
            </section>
          )}

          {tab === "terms" && lang === "en" && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Terms & Conditions</h2>
              <p className="text-sm text-gray-600 mb-4">By using <span className="font-medium">Buddytourguide</span> you agree to the following terms. Please read carefully.</p>

              <h3 className="font-semibold mt-6">1. Agreement to Terms</h3>
              <p className="text-gray-700">Use of our site constitutes acceptance of these Terms & Conditions. If you disagree, do not use the service.</p>

              <h3 className="font-semibold mt-6">2. User Conduct</h3>
              <p className="text-gray-700">Users must not engage in illegal activities, harassment, or attempts to breach platform security. We may suspend or ban users who violate rules.</p>

              <h3 className="font-semibold mt-6">3. Intellectual Property</h3>
              <p className="text-gray-700">All content on the platform is owned or licensed to Buddytourguide. You may not copy or republish content without permission.</p>

              <h3 className="font-semibold mt-6">4. Payments & Cancellations</h3>
              <p className="text-gray-700">Payments are processed by Paymob. Refunds and cancellations follow our booking policy; please see the booking flow for specifics.</p>

              <h3 className="font-semibold mt-6">5. Liability</h3>
              <p className="text-gray-700">We are not liable for indirect or consequential damages arising from use of the platform. Guides are independent providers; we act as a marketplace.</p>

              <h3 className="font-semibold mt-6">6. Governing Law</h3>
              <p className="text-gray-700">These terms are governed by the laws of the country where Buddytourguide is registered. Users in the EU and California retain the protections afforded by GDPR and CCPA respectively.</p>

              <h3 className="font-semibold mt-6">7. Changes to Terms</h3>
              <p className="text-gray-700">We may update these terms. Continued use after changes indicates acceptance.</p>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm">Questions? Contact <a className="text-blue-600 underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
              </div>
            </section>
          )}

          {tab === "terms" && lang === "ar" && (
            <section dir="rtl" className="text-right">
              <h2 className="text-xl font-semibold mb-4">الشروط والأحكام</h2>
              <p className="text-sm text-gray-600 mb-4">باستخدامك لموقع <span className="font-medium">Buddytourguide</span> فإنك توافق على الشروط التالية. الرجاء قراءة الشروط بعناية.</p>

              <h3 className="font-semibold mt-6">1. الموافقة على الشروط</h3>
              <p className="text-gray-700">باستخدام الموقع فإنك توافق على هذه الشروط. إذا كنت لا توافق، لا تستخدم الخدمة.</p>

              <h3 className="font-semibold mt-6">2. سلوك المستخدم</h3>
              <p className="text-gray-700">يجب ألا يشارك المستخدمون في أنشطة غير قانونية أو مضايقات أو محاولات اختراق. قد نقوم بتعليق أو حظر المخالفين.</p>

              <h3 className="font-semibold mt-6">3. الملكية الفكرية</h3>
              <p className="text-gray-700">جميع المحتويات على المنصة مملوكة لـ Buddytourguide أو مرخّصة لها. لا يسمح بنسخ المحتوى دون إذن.</p>

              <h3 className="font-semibold mt-6">4. المدفوعات والإلغاء</h3>
              <p className="text-gray-700">تتم معالجة المدفوعات عبر Paymob. سياسات الاسترجاع والإلغاء تتبع سياسة الحجز المتاحة خلال عملية الحجز.</p>

              <h3 className="font-semibold mt-6">5. المسؤولية</h3>
              <p className="text-gray-700">لسنا مسؤولين عن الأضرار غير المباشرة الناتجة عن استخدام المنصة. المرشدون مستقلون ونحن نعمل كمنصة سوقية.</p>

              <h3 className="font-semibold mt-6">6. القانون الواجب التطبيق</h3>
              <p className="text-gray-700">تخضع هذه الشروط لقوانين بلد تسجيل Buddytourguide. المستخدمون في الاتحاد الأوروبي وكاليفورنيا يتمتعون بحماية قوانين GDPR وCCPA على التوالي.</p>

              <h3 className="font-semibold mt-6">7. التعديلات</h3>
              <p className="text-gray-700">نحتفظ بالحق في تعديل الشروط، واستخدامك المستمر بعد التعديل يعني قبولك للتغييرات.</p>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm">للاستفسارات تواصل عبر <a className="text-blue-600 underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
              </div>
            </section>
          )}
        </main>

        <footer className="p-6 border-t text-sm text-gray-500">
          <div className="max-w-5xl mx-auto">© {new Date().getFullYear()} Buddytourguide • For support: <a className="underline text-blue-600" href={`mailto:${supportEmail}`}>{supportEmail}</a></div>
        </footer>
      </div>
    </div>
  );
}
