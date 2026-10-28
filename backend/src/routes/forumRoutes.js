import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getThreads, getThread, createThread, updateThread,
  toggleThreadLike, addReply, deleteReply, deleteThread,
} from '../controllers/forumController.js';

const router = express.Router();

const CATEGORIES = [
  'General Discussion', 'Training & Technique', 'Races & Events',
  'Gear & Equipment', 'Nutrition & Health', 'Motivation & Support',
];

router.get('/', getThreads);
router.get('/:id', getThread);

router.post('/', protect, [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5–200 characters'),
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Write something (max 5,000 characters)'),
  body('category').isIn(CATEGORIES).withMessage('Choose a valid category'),
], validate, createThread);

router.put('/:id', protect, [
  body('title').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5–200 characters'),
  body('content').optional().trim().isLength({ min: 1, max: 5000 }).withMessage('Write something (max 5,000 characters)'),
  body('category').optional().isIn(CATEGORIES).withMessage('Choose a valid category'),
], validate, updateThread);

router.post('/:id/like', protect, toggleThreadLike);

router.post('/:id/replies', protect, [
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Reply must be 1–5,000 characters'),
], validate, addReply);
router.delete('/:id/replies/:replyId', protect, deleteReply);

router.delete('/:id', protect, deleteThread);

export default router;
