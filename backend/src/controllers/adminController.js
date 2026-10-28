import mongoose from 'mongoose';
import User from '../models/User.js';
import { deleteUserData } from '../utils/userData.js';
import Run from '../models/Run.js';
import BlogPost from '../models/BlogPost.js';
import ForumThread from '../models/ForumThread.js';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';

export const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalRuns, totalBlogPosts, totalThreads, newsletterSubscribers] =
      await Promise.all([
        User.countDocuments({ active: true }),
        Run.countDocuments(),
        BlogPost.countDocuments({ published: true }),
        ForumThread.countDocuments(),
        NewsletterSubscriber.countDocuments({ active: true }),
      ]);
    res.json({ success: true, data: { totalUsers, totalRuns, totalBlogPosts, totalThreads, newsletterSubscribers } });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

export const getRecentActivity = async (req, res) => {
  try {
    const [recentUsers, recentRuns, recentPosts, recentThreads] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(4).select('name email createdAt'),
      Run.find().sort({ createdAt: -1 }).limit(4).populate('userId', 'name').select('distance createdAt userId'),
      BlogPost.find().sort({ createdAt: -1 }).limit(4).select('title createdAt published'),
      ForumThread.find().sort({ createdAt: -1 }).limit(4).populate('author', 'name').select('title createdAt author'),
    ]);

    const activity = [
      ...recentUsers.map((u) => ({ type: 'user', action: 'New user registration', detail: u.email, time: u.createdAt })),
      ...recentRuns.map((r) => ({ type: 'run', action: 'Run logged', detail: `${r.distance?.toFixed(1)} km by ${r.userId?.name || 'Unknown'}`, time: r.createdAt })),
      ...recentPosts.map((p) => ({ type: 'blog', action: p.published ? 'Blog post published' : 'Blog post drafted', detail: p.title, time: p.createdAt })),
      ...recentThreads.map((t) => ({ type: 'forum', action: 'New forum thread', detail: `"${t.title}" by ${t.author?.name || 'Unknown'}`, time: t.createdAt })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);

    res.json({ success: true, data: activity });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

// Supports ?q= (name/email search), ?role=, ?status=active|inactive
export const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const query = {};
    if (req.query.q) {
      const rx = new RegExp(String(req.query.q).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: rx }, { email: rx }];
    }
    if (['user', 'admin'].includes(req.query.role)) query.role = req.query.role;
    if (req.query.status === 'active') query.active = true;
    if (req.query.status === 'inactive') query.active = false;

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).limit(limit).skip(skip),
      User.countDocuments(query),
    ]);
    res.json({ success: true, data: { items: users, page, pages: Math.max(Math.ceil(total / limit), 1), total } });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'User not found' });
    const isSelf = req.params.id === req.user._id.toString();
    // An admin can't remove their own admin role or deactivate themselves (lock-out protection)
    if (isSelf && (req.body.role === 'user' || req.body.active === false)) {
      return res.status(400).json({ success: false, message: "You can't remove your own admin access or deactivate yourself" });
    }

    const updates = {};
    if (typeof req.body.name === 'string') updates.name = req.body.name;
    if (typeof req.body.bio === 'string') updates.bio = req.body.bio;
    if (typeof req.body.avatar === 'string') updates.avatar = req.body.avatar;
    if (['user', 'admin'].includes(req.body.role)) updates.role = req.body.role;
    if (typeof req.body.active === 'boolean') updates.active = req.body.active;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Role or status change: sign the user out everywhere so it takes effect immediately
    if (updates.role !== undefined || updates.active === false) {
      await User.updateOne({ _id: user._id }, { $inc: { tokenVersion: 1 } }, { timestamps: false });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account here' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'User not found' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Remove their runs, threads, replies, likes and notifications; hand any blog posts to this admin
    await deleteUserData(user._id, req.user._id);
    await user.deleteOne();
    res.json({ success: true, message: 'User and their data deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

// ── Live analytics time-series endpoint ──────────────────────────────────────
export const getAnalytics = async (req, res) => {
  try {
    const now = new Date();

    // ── Daily runs for the last 7 days ──────────────────────────────────────
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyRuns = await Run.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            year:  { $year:  '$createdAt' },
            month: { $month: '$createdAt' },
            day:   { $dayOfMonth: '$createdAt' },
          },
          runs: { $sum: 1 },
          distance: { $sum: '$distance' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    // Fill in missing days with 0
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
      const found = dailyRuns.find(
        (r) => r._id.year === y && r._id.month === m && r._id.day === day
      );
      weeklyData.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.toISOString().slice(0, 10),
        runs: found?.runs ?? 0,
        distance: found ? Math.round(found.distance * 10) / 10 : 0,
      });
    }

    // ── Monthly user signups for the last 6 months ───────────────────────────
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlySignups = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year:  { $year:  '$createdAt' },
            month: { $month: '$createdAt' },
          },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Fill 6 months, compute cumulative total
    const totalUsersBefore = await User.countDocuments({ createdAt: { $lt: sixMonthsAgo } });
    let running = totalUsersBefore;
    const userGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear(), m = d.getMonth() + 1;
      const found = monthlySignups.find((r) => r._id.year === y && r._id.month === m);
      running += found?.newUsers ?? 0;
      userGrowth.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        year: y,
        newUsers: found?.newUsers ?? 0,
        totalUsers: running,
      });
    }

    // ── Forum thread category breakdown ──────────────────────────────────────
    const categoryCounts = await ForumThread.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const totalThreads = categoryCounts.reduce((s, c) => s + c.count, 0);
    const categories = categoryCounts.map((c) => ({
      name: c._id,
      count: c.count,
      pct: totalThreads > 0 ? Math.round((c.count / totalThreads) * 100) : 0,
    }));

    res.json({
      success: true,
      data: { weeklyData, userGrowth, categories },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    });
  }
};
