import mongoose from 'mongoose';
import User from '../models/User.js';
import Run from '../models/Run.js';
import ForumThread from '../models/ForumThread.js';
import BlogPost from '../models/BlogPost.js';
import Notification from '../models/Notification.js';

// Recomputes a user's running totals from their runs. Called after any run is
// created, edited or deleted so the totals can never drift out of sync.
export async function recalcUserStats(userId) {
  const id = new mongoose.Types.ObjectId(String(userId));
  const [s] = await Run.aggregate([
    { $match: { userId: id } },
    {
      $group: {
        _id: null,
        totalRuns: { $sum: 1 },
        totalDistance: { $sum: '$distance' },
        totalDuration: { $sum: '$duration' },
      },
    },
  ]);
  const totals = s || { totalRuns: 0, totalDistance: 0, totalDuration: 0 };
  // Average pace = total minutes / total km (weighted by distance, unlike $avg of paces)
  const averagePace = totals.totalDistance > 0 ? totals.totalDuration / 60 / totals.totalDistance : 0;
  await User.updateOne(
    { _id: id },
    { $set: { totalRuns: totals.totalRuns, totalDistance: totals.totalDistance, totalDuration: totals.totalDuration, averagePace } },
    { timestamps: false }
  );
  return { ...totals, averagePace };
}

// Removes everything a user created, so deleting an account doesn't leave
// orphaned runs, threads, replies, likes or notifications behind.
// Blog posts are kept and handed to `reassignPostsTo` (the admin doing the delete).
export async function deleteUserData(userId, reassignPostsTo) {
  const id = new mongoose.Types.ObjectId(String(userId));
  await Promise.all([
    Run.deleteMany({ userId: id }),
    ForumThread.deleteMany({ author: id }),
    ForumThread.updateMany(
      {},
      { $pull: { replies: { author: id }, likes: id } },
      { timestamps: false }
    ),
    ForumThread.updateMany(
      { 'replies.likes': id },
      { $pull: { 'replies.$[].likes': id } },
      { timestamps: false }
    ),
    Notification.deleteMany({ $or: [{ recipient: id }, { actor: id }] }),
    Notification.updateMany({ broadcast: true }, { $pull: { readBy: id, dismissedBy: id } }),
    BlogPost.updateMany({}, { $pull: { comments: { author: id } } }, { timestamps: false }),
    reassignPostsTo
      ? BlogPost.updateMany({ author: id }, { $set: { author: reassignPostsTo } }, { timestamps: false })
      : Promise.resolve(),
  ]);
}
