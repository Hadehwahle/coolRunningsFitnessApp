import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFound } from './middleware/error.js';

import authRoutes from './routes/authRoutes.js';
import runRoutes from './routes/runRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import forumRoutes from './routes/forumRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import sitemapRoutes from './routes/sitemapRoutes.js';

// The Express app, without the database connection or HTTP listener.
// server.js wires those up; tests import this file directly.
const app = express();

// Behind Render/Railway/Nginx, trust the first proxy so rate limits and
// secure cookies see the real client IP and protocol.
if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
}

const isTest = process.env.NODE_ENV === 'test';

app.use(helmet({
  // Allow the frontend (a different origin) to display images from /uploads.
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((o) => o.trim());
app.use(cors({ origin: allowedOrigins, credentials: true, optionsSuccessStatus: 200 }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

if (!isTest) app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ── Rate limits ─────────────────────────────────────────────────────────────
const limit = (max, message, extra = {}) => rateLimit({
  windowMs: 15 * 60 * 1000,
  max,
  message: { success: false, message },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  ...extra,
});

const generalLimiter = limit(Number(process.env.RATE_LIMIT_MAX) || 300, 'Too many requests, please try again in a few minutes.');
// Only failed attempts count, so people sharing one IP (office, campus, mobile
// network) don't lock each other out by signing in successfully.
const authLimiter = limit(Number(process.env.AUTH_RATE_LIMIT_MAX) || 10, 'Too many attempts, please try again later.', {
  skipSuccessfulRequests: true,
});
const adminLimiter = limit(Number(process.env.ADMIN_RATE_LIMIT_MAX) || 300, 'Too many requests, please try again later.');
const writeLimiter = limit(Number(process.env.WRITE_RATE_LIMIT_MAX) || 60, 'You are posting too fast. Please slow down.');

app.use('/api/', (req, res, next) => (req.path.startsWith('/admin') ? next() : generalLimiter(req, res, next)));
['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password']
  .forEach((p) => app.use(p, authLimiter));
['/api/contact', '/api/newsletter'].forEach((p) => app.use(p, writeLimiter));
app.use('/api/forum', (req, res, next) => (req.method === 'POST' ? writeLimiter(req, res, next) : next()));

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// Uploaded files (local storage mode)
app.use('/uploads', express.static('uploads', { maxAge: '30d' }));

app.use('/', sitemapRoutes); // /sitemap.xml
app.use('/api/auth', authRoutes);
app.use('/api/runs', runRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', publicRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'CoolRunningsFitness API', version: '1.1.0' });
});

app.use(notFound);
app.use(errorHandler);

export default app;
