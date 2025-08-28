// routes/sitemapRoute.js
const express = require('express');
const { Pool } = require('pg');

const router = express.Router();

// ====== إعدادات أساسية ======
const BASE =
  (process.env.FRONTEND_URL || 'https://buddytourguide.com').replace(/\/+$/, '');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Railway/Heroku غالباً محتاج TLS
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// كاش بسيط في الذاكرة لمدة ساعة
const CACHE_TTL_MS = 60 * 60 * 1000;
let cache = { ts: 0, xml: '' };

function xmlEscape(s = '') {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

router.get('/sitemap.xml', async (req, res) => {
  try {
    // رجّع من الكاش لو صالح
    if (cache.xml && Date.now() - cache.ts < CACHE_TTL_MS) {
      res.set('Cache-Control', 'public, max-age=3600');
      return res.type('application/xml').send(cache.xml);
    }

    // جِب اللينكات الأساسية الثابتة
    const staticUrls = [
      { loc: `${BASE}/`, priority: '1.0' },
      { loc: `${BASE}/tours`, priority: '0.9' },
      { loc: `${BASE}/about`, priority: '0.8' },
      { loc: `${BASE}/contact`, priority: '0.8' },
    ];

    // هنجرب نجيب slugs لو فيه، وإلا ids
    // عدّل اسم الجدول/الأعمدة حسب سكيمتك
    // أمثلة شائعة:
    // tours(slug, updated_at, published)
    // tours(id, updated_at, is_published)
    const client = await pool.connect();
    let rows = [];

    try {
      // جرّب slug أولاً
      const q1 = await client.query(
        `SELECT slug AS token, updated_at
         FROM tours
         WHERE (published = true OR is_published = true OR published IS NULL)
         ORDER BY updated_at DESC NULLS LAST
         LIMIT 5000`
      );
      rows = q1.rows;

      // لو مفيش slug، استخدم id
      if (!rows || rows.length === 0) {
        const q2 = await client.query(
          `SELECT id::text AS token, updated_at
           FROM tours
           WHERE (published = true OR is_published = true OR published IS NULL)
           ORDER BY updated_at DESC NULLS LAST
           LIMIT 5000`
        );
        rows = q2.rows;
      }
    } finally {
      client.release();
    }

    // حوّل النتائج لروابط
    const dynamicUrls = (rows || []).map((r) => {
      const token = encodeURIComponent(r.token);
      return {
        loc: `${BASE}/tour/${token}`,
        lastmod: r.updated_at ? new Date(r.updated_at).toISOString().split('T')[0] : undefined,
        priority: '0.7',
      };
    });

    const allUrls = [...staticUrls, ...dynamicUrls];

    // بِنِ الـ XML
    const urlsXml = allUrls
      .map((u) => {
        const lastmodTag = u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : '';
        return (
          `  <url>\n` +
          `    <loc>${xmlEscape(u.loc)}</loc>\n` +
          (lastmodTag ? `    ${lastmodTag}\n` : '') +
          `    <priority>${u.priority}</priority>\n` +
          `  </url>`
        );
      })
      .join('\n');

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `${urlsXml}\n` +
      `</urlset>\n`;

    // خزّن في الكاش وارجع
    cache = { ts: Date.now(), xml };
    res.set('Cache-Control', 'public, max-age=3600'); // ساعة
    return res.type('application/xml').send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);

    // fallback بسيط لا يقع السيرفر لو فيه مشكلة DB
    const fallback =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `  <url><loc>${xmlEscape(BASE + '/')}</loc><priority>1.0</priority></url>\n` +
      `  <url><loc>${xmlEscape(BASE + '/tours')}</loc><priority>0.9</priority></url>\n` +
      `</urlset>\n`;

    res.set('Cache-Control', 'no-store');
    return res.type('application/xml').send(fallback);
  }
});

module.exports = router;
