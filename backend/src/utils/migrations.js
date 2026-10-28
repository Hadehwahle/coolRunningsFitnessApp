import ForumThread from '../models/ForumThread.js';

// Small, idempotent data fixes that run on startup. Safe to run every time.
export async function runMigrations() {
  // Threads created before `lastActivityAt` existed: use their last update time
  const res = await ForumThread.updateMany(
    { lastActivityAt: { $exists: false } },
    [{ $set: { lastActivityAt: { $ifNull: ['$updatedAt', '$createdAt'] } } }],
    { timestamps: false }
  );
  if (res.modifiedCount) console.log(`🛠  Backfilled lastActivityAt on ${res.modifiedCount} threads`);
}
