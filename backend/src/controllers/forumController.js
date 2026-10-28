import mongoose from 'mongoose';
import ForumThread from '../models/ForumThread.js';
import { emitTo } from '../socket.js';
import { asyncHandler } from '../middleware/error.js';
import { notifyThreadReply, notifyThreadLike } from '../utils/notifications.js';

const notFound = (res) => res.status(404).json({ success: false, message: 'Discussion not found' });

// @route GET /api/forum
// Returns thread summaries only. It used to send every thread with all of its
// replies embedded, which gets very heavy as the forum grows.
export const getThreads = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 200);
  const match = {};
  if (req.query.category) match.category = String(req.query.category);
  if (req.query.author && mongoose.isValidObjectId(req.query.author)) {
    match.author = new mongoose.Types.ObjectId(String(req.query.author));
  }

  const [items, total] = await Promise.all([
    ForumThread.aggregate([
      { $match: match },
      { $sort: { pinned: -1, lastActivityAt: -1, createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          title: 1, category: 1, pinned: 1, locked: 1, views: 1, tags: 1, author: 1,
          createdAt: 1, updatedAt: 1, lastActivityAt: 1, likes: 1,
          content: { $substrCP: ['$content', 0, 280] },
          replyCount: { $size: { $ifNull: ['$replies', []] } },
          likeCount: { $size: { $ifNull: ['$likes', []] } },
        },
      },
      { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
      { $addFields: { author: { _id: '$author._id', name: '$author.name', avatar: '$author.avatar' } } },
    ]),
    ForumThread.countDocuments(match),
  ]);

  res.json({ success: true, data: { items, page, pages: Math.max(Math.ceil(total / limit), 1), total } });
});

// @route GET /api/forum/:id
export const getThread = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

  // Count the view without touching updatedAt / lastActivityAt. Previously
  // `views += 1; save()` bumped updatedAt, so merely opening a thread moved it
  // to the top of the forum.
  const thread = await ForumThread.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true, timestamps: false }
  )
    .populate('author', 'name avatar bio')
    .populate('replies.author', 'name avatar');

  if (!thread) return notFound(res);
  res.json({ success: true, data: thread });
});

// @route POST /api/forum
export const createThread = asyncHandler(async (req, res) => {
  const { title, content, category, tags } = req.body;
  const thread = await ForumThread.create({
    title, content, category,
    tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
    author: req.user._id,
    lastActivityAt: new Date(),
  });
  await thread.populate('author', 'name avatar');

  emitTo('community', 'new-thread', { ...thread.toObject(), replies: undefined, replyCount: 0, likeCount: 0 });
  res.status(201).json({ success: true, data: thread });
});

// @route PUT /api/forum/:id  (author edits title/content; admin can also pin/lock)
export const updateThread = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);
  const thread = await ForumThread.findById(req.params.id);
  if (!thread) return notFound(res);

  const isAuthor = thread.author.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isAuthor && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorised' });

  ['title', 'content', 'category'].forEach((k) => { if (req.body[k] !== undefined) thread[k] = req.body[k]; });
  if (isAdmin) ['pinned', 'locked'].forEach((k) => { if (typeof req.body[k] === 'boolean') thread[k] = req.body[k]; });

  await thread.save();
  res.json({ success: true, data: thread });
});

// @route POST /api/forum/:id/like
export const toggleThreadLike = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);
  const me = req.user._id;

  // Atomic toggle, so two quick clicks can't double-like
  let thread = await ForumThread.findOneAndUpdate(
    { _id: req.params.id, likes: { $ne: me } },
    { $addToSet: { likes: me } },
    { new: true, timestamps: false }
  );
  let liked = true;
  if (!thread) {
    thread = await ForumThread.findOneAndUpdate(
      { _id: req.params.id },
      { $pull: { likes: me } },
      { new: true, timestamps: false }
    );
    liked = false;
  }
  if (!thread) return notFound(res);

  emitTo(`thread:${req.params.id}`, 'thread-liked', { threadId: req.params.id, likes: thread.likes });
  if (liked) notifyThreadLike(thread, me, req.user.name);

  res.json({ success: true, data: { likes: thread.likes, liked } });
});

// @route POST /api/forum/:id/replies
export const addReply = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);
  const thread = await ForumThread.findById(req.params.id);
  if (!thread) return notFound(res);
  if (thread.locked) return res.status(400).json({ success: false, message: 'This discussion is locked' });

  thread.replies.push({ author: req.user._id, content: req.body.content });
  thread.lastActivityAt = new Date();
  await thread.save();

  const newReply = thread.replies[thread.replies.length - 1].toObject();
  newReply.author = { _id: req.user._id, name: req.user.name, avatar: req.user.avatar };

  emitTo(`thread:${req.params.id}`, 'new-reply', newReply);
  emitTo('community', 'thread-activity', { _id: thread._id, replyCount: thread.replies.length, lastActivityAt: thread.lastActivityAt });
  notifyThreadReply(thread, req.user._id, req.user.name);

  res.status(201).json({ success: true, data: newReply });
});

// @route DELETE /api/forum/:id/replies/:replyId  (reply author or admin)
export const deleteReply = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);
  const thread = await ForumThread.findById(req.params.id);
  if (!thread) return notFound(res);
  const reply = thread.replies.id(req.params.replyId);
  if (!reply) return res.status(404).json({ success: false, message: 'Reply not found' });

  const isAuthor = reply.author.toString() === req.user._id.toString();
  if (!isAuthor && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorised' });

  reply.deleteOne();
  await thread.save({ timestamps: false });
  emitTo(`thread:${req.params.id}`, 'reply-removed', { replyId: req.params.replyId });
  res.json({ success: true, message: 'Reply deleted' });
});

// @route DELETE /api/forum/:id  (author or admin)
export const deleteThread = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);
  const thread = await ForumThread.findById(req.params.id);
  if (!thread) return notFound(res);

  const isAuthor = thread.author.toString() === req.user._id.toString();
  if (!isAuthor && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorised' });

  await thread.deleteOne();
  emitTo('community', 'thread-removed', { _id: thread._id });
  res.json({ success: true, message: 'Discussion deleted' });
});
