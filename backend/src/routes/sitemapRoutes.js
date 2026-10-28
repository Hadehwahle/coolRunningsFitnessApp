import express from 'express';
import BlogPost from '../models/BlogPost.js';
import ForumThread from '../models/ForumThread.js';

const router = express.Router();

const STATIC_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/blog', changefreq: 'daily', priority: '0.9' },
  { path: '/community', changefreq: 'daily', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'yearly', priority: '0.4' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.2' },
  { path: '/terms', changefreq: 'yearly', priority: '0.2' },
  { path: '/disclaimer', changefreq: 'yearly', priority: '0.2' },
];

const xmlEscape = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

// GET /sitemap.xml — generated from the database so every published post and
// discussion is listed (the old static file only had 5 pages).
router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const site = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const [posts, threads] = await Promise.all([
      BlogPost.find({ published: true }).select('slug updatedAt').sort({ publishedAt: -1 }).limit(5000).lean(),
      ForumThread.find({}).select('_id lastActivityAt updatedAt').sort({ lastActivityAt: -1 }).limit(5000).lean(),
    ]);

    const url = (loc, lastmod, changefreq, priority) => [
      '  <url>',
      `    <loc>${xmlEscape(site + loc)}</loc>`,
      lastmod ? `    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : '',
      changefreq ? `    <changefreq>${changefreq}</changefreq>` : '',
      priority ? `    <priority>${priority}</priority>` : '',
      '  </url>',
    ].filter(Boolean).join('\n');

    const body = [
      ...STATIC_PAGES.map((p) => url(p.path, null, p.changefreq, p.priority)),
      ...posts.map((p) => url(`/blog/${p.slug}`, p.updatedAt, 'monthly', '0.8')),
      ...threads.map((t) => url(`/community/thread/${t._id}`, t.lastActivityAt || t.updatedAt, 'weekly', '0.5')),
    ].join('\n');

    res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
    );
  } catch (err) {
    next(err);
  }
});

export default router;
