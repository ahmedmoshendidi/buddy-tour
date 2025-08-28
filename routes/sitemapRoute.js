// routes/sitemapRoute.js
const express = require('express');
const { Pool } = require('pg');

const router = express.Router();

/** ===== Base URL =====
 * نحاول نجيب الدومين من ENV (FRONTEND_URL).
 * لو مش موجود نكوّنه من الـ request (protocol + host).
 * بنشيل أي / في الآخر.
 */
function getBase(req) {
  const fromEnv = (process.env.FRONTEND_URL || '').trim();
  const base = fromEnv
    ? fromEnv
    : `${req.protocol}://${req.get('host')}`;
  return base.replace(/\/+$/, '');
}

// --- PG pool (مرّة واحدة) ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// كاش بسيط لمدة ساعة
const CACHE_TTL_MS = 60 * 60 * 1000;
let cache = { ts: 0, xml: '' };

function xmlEscape(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

router.get('/sitemap.xml', async (req, res) => {
  try {
    // إرجاع من الكاش لو صالح
    if (cache.xml && Date.now() - cache.ts < CACHE_TTL_MS) {
      res.set('Cache-Control', 'public, max-age=3600');
      return res.type('application/xml; charset=UTF-8').send(cache.xml);
    }

    const BASE = getBase(req);

    // صفحات ثابتة
    const staticUrls = [
      { loc: `${BASE}/`,       priority: '1.0' },
      { loc: `${BASE}/tours`,  priority: '0.9' },
      { loc: `${BASE}/about`,  priority: '0.8' },
      { loc: `${BASE}/contact`,priority: '0.8' },
    ];

    // روابط ديناميكية من DB
    const client = await pool.connect();
    let rows = [];
    try {
      // أولاً slug (مع created_at) – استبعد الفارغ/NULL
      const q1 = await client.query(
        `SELECT slug AS token, created_at
           FROM tours
          WHERE slug IS NOT NULL AND length(trim(slug)) > 0
          ORDER BY created_at DESC NULLS LAST
          LIMIT 5000`
      );
      rows = q1.rows;

      // fallback: استخدم id لو مفيش slugs
      if (!rows || rows.length === 0) {
        const q2 = await client.query(
          `SELECT id::text AS token, created_at
             FROM tours
            ORDER BY created_at DESC NULLS LAST
            LIMIT 5000`
        );
        rows = q2.rows;
      }
    } finally {
      client.release();
    }

    const dynamicUrls = (rows || []).map((r) => {
      const token = encodeURIComponent(r.token);
      return {
        loc: `${BASE}/tour/${token}`,
        lastmod: r.created_at
          ? new Date(r.created_at).toISOString().split('T')[0]
          : undefined,
        priority: '0.7',
      };
    });

    const allUrls = [...staticUrls, ...dynamicUrls];

    const urlsXml = allUrls
      .map((u) => {
        const lastmodTag = u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : '';
        return (
          `  <url>\n` +
          `    <loc>${xmlEscape(u.loc)}</loc>\n` +
          lastmodTag +
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

    // Cache
    cache = { ts: Date.now(), xml };
    res.set('Cache-Control', 'public, max-age=3600');
    return res.type('application/xml; charset=UTF-8').send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);

    const BASE = getBase(req);
    // Fallback بسيط
    const fallback =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `  <url>\n    <loc>${xmlEscape(BASE + '/')}</loc>\n    <priority>1.0</priority>\n  </url>\n` +
      `  <url>\n    <loc>${xmlEscape(BASE + '/tours')}</loc>\n    <priority>0.9</priority>\n  </url>\n` +
      `</urlset>\n`;

    res.set('Cache-Control', 'no-store');
    return res.type('application/xml; charset=UTF-8').send(fallback);
  }
});

module.exports = router;
