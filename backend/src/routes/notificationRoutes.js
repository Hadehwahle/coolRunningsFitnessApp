import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import Notification from '../models/Notification.js';

const router = express.Router();
router.use(protect);

// Personal notifications + broadcasts created since the user joined that they
// haven't dismissed (and only blog broadcasts if they want them).
function visibleQuery(user) {
  const me = user._id;
  const wantsBlog = user.preferences?.notifications?.newBlogPost !== false;
  const or = [{ recipient: me }];
  if (wantsBlog) {
    or.push({ broadcast: true, createdAt: { $gte: user.createdAt }, dismissedBy: { $ne: me } });
  }
  return { $or: or };
}

function unreadQuery(user) {
  const me = user._id;
  const wantsBlog = user.preferences?.notifications?.newBlogPost !== false;
  const or = [{ recipient: me, read: false }];
  if (wantsBlog) {
    or.push({ broadcast: true, createdAt: { $gte: user.createdAt }, dismissedBy: { $ne: me }, readBy: { $ne: me } });
  }
  return { $or: or };
}

// GET /api/notifications
router.get('/', asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const me = req.user._id.toString();

  const [docs, unreadCount] = await Promise.all([
    Notification.find(visibleQuery(req.user))
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('actor', 'name')
      .lean(),
    Notification.countDocuments(unreadQuery(req.user)),
  ]);

  const notifications = docs.map(({ readBy, dismissedBy, ...n }) => ({
    ...n,
    read: n.broadcast ? (readBy || []).some((id) => id.toString() === me) : n.read,
  }));

  res.json({ success: true, data: { notifications, unreadCount } });
}));

// PUT /api/notifications/read-all
router.put('/read-all', asyncHandler(async (req, res) => {
  const me = req.user._id;
  await Promise.all([
    Notification.updateMany({ recipient: me, read: false }, { read: true }),
    Notification.updateMany(
      { broadcast: true, createdAt: { $gte: req.user.createdAt }, readBy: { $ne: me } },
      { $addToSet: { readBy: me } }
    ),
  ]);
  res.json({ success: true, message: 'All notifications marked as read' });
}));

// PUT /api/notifications/:id/read
router.put('/:id/read', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Not found' });
  const me = req.user._id;
  await Promise.all([
    Notification.updateOne({ _id: req.params.id, recipient: me }, { read: true }),
    Notification.updateOne({ _id: req.params.id, broadcast: true }, { $addToSet: { readBy: me } }),
  ]);
  res.json({ success: true });
}));

// DELETE /api/notifications/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Not found' });
  const me = req.user._id;
  await Promise.all([
    Notification.deleteOne({ _id: req.params.id, recipient: me }),
    Notification.updateOne({ _id: req.params.id, broadcast: true }, { $addToSet: { dismissedBy: me, readBy: me } }),
  ]);
  res.json({ success: true });
}));

export default router;
