import express from 'express';
import { getBlogPosts, getBlogPost, getFeaturedPosts } from '../controllers/blogController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getBlogPosts);
router.get('/featured', getFeaturedPosts);
router.get('/:slug', optionalAuth, getBlogPost); // admins can preview drafts

export default router;
