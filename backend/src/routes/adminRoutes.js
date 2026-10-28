import express from 'express';
import { body } from 'express-validator';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getDashboardStats,
  getRecentActivity,
  getAnalytics,
  getAllUsers,
  updateUser,
  deleteUser,
} from '../controllers/adminController.js';
import {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getAllBlogPostsAdmin,
} from '../controllers/blogController.js';
import { getContactMessages } from '../controllers/contactController.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect, adminOnly);

// Dashboard stats
router.get('/stats', getDashboardStats);
router.get('/activity', getRecentActivity);
router.get('/analytics', getAnalytics);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Blog management
// Accepts either an https:// URL or a path returned by our own upload endpoint
// (/uploads/…). Before, uploaded images were rejected because only https URLs passed.
const isImageRef = (v) => {
  if (v.startsWith('/uploads/') && !v.includes('..')) return true;
  try {
    return new URL(v).protocol === 'https:';
  } catch {
    return false;
  }
};

const blogValidation = (optional = false) => {
  const f = (name) => (optional ? body(name).optional() : body(name));
  return [
    f('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5–200 characters'),
    f('excerpt').trim().isLength({ min: 10, max: 500 }).withMessage('Excerpt must be 10–500 characters'),
    f('content').trim().isLength({ min: 1, max: 50000 }).withMessage('Content is required (max 50,000 characters)'),
    f('category').notEmpty().withMessage('Category is required'),
    body('readTime').optional({ values: 'falsy' }).toInt().isInt({ min: 1, max: 120 }).withMessage('Read time must be 1–120 minutes'),
    body('featuredImage').optional({ values: 'falsy' }).isString().custom(isImageRef)
      .withMessage('Featured image must be an https:// URL or an uploaded image'),
    body('published').optional().isBoolean().toBoolean(),
    body('featured').optional().isBoolean().toBoolean(),
  ];
};

router.get('/blog', getAllBlogPostsAdmin);
router.post('/blog', blogValidation(false), validate, createBlogPost);
router.put('/blog/:id', blogValidation(true), validate, updateBlogPost);
router.delete('/blog/:id', deleteBlogPost);

// Contact messages
router.get('/contact', getContactMessages);

export default router;
