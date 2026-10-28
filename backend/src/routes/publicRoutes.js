import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import {
  submitContact,
  subscribeNewsletter,
  unsubscribeNewsletter,
} from '../controllers/contactController.js';
import User from '../models/User.js';
import Run from '../models/Run.js';
import ForumThread from '../models/ForumThread.js';
import BlogPost from '../models/BlogPost.js';

const router = express.Router();

// ── Public platform stats ────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalRuns, totalThreads, totalPosts, totalBlogPosts] = await Promise.all([
      User.countDocuments({ active: true }),
      Run.countDocuments(),
      ForumThread.countDocuments(),
      // Count total replies across all threads
      ForumThread.aggregate([
        { $project: { replyCount: { $size: '$replies' } } },
        { $group: { _id: null, total: { $sum: '$replyCount' } } },
      ]).then((r) => r[0]?.total ?? 0),
      BlogPost.countDocuments({ published: true }),
    ]);

    res.json({
      success: true,
      data: { totalUsers, totalRuns, totalThreads, totalPosts, totalBlogPosts },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Contact form validation
const contactValidation = [
  body('name').trim().notEmpty().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('subject').trim().notEmpty().isLength({ min: 5, max: 200 }),
  body('message').trim().notEmpty().isLength({ max: 5000 }),
];

// Newsletter validation
const newsletterValidation = [
  body('email').isEmail().normalizeEmail(),
];

// Routes
router.post('/contact', contactValidation, validate, submitContact);
router.post('/newsletter/subscribe', newsletterValidation, validate, subscribeNewsletter);
router.post('/newsletter/unsubscribe', newsletterValidation, validate, unsubscribeNewsletter);

export default router;
