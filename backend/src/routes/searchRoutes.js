import express from 'express';
import BlogPost from '../models/BlogPost.js';
import ForumThread from '../models/ForumThread.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/search?q=term
// @access  Public
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) {
      return res.json({ success: true, data: { posts: [], threads: [] } });
    }

    // Escape special regex characters to prevent ReDoS
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    const [posts, threads] = await Promise.all([
      BlogPost.find({
        published: true,
        $or: [
          { title: regex },
          { excerpt: regex },
          { category: regex },
          { tags: regex },
        ],
      })
        .select('title slug excerpt category featuredImage readTime createdAt')
        .limit(6)
        .lean(),

      ForumThread.find({
        $or: [{ title: regex }, { content: regex }, { category: regex }],
      })
        .populate('author', 'name')
        .select('title category author views createdAt')
        .limit(5)
        .lean(),
    ]);

    res.json({ success: true, data: { posts, threads } });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

export default router;
