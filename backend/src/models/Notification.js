import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

// Two kinds of notification:
//  • personal  – `recipient` set, `read` tracks state (replies, likes)
//  • broadcast – `broadcast: true`, one document for everyone (new blog posts);
//                per-user state lives in `readBy` / `dismissedBy`. This replaces
//                writing one document per user for every new post.
const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: ObjectId, ref: 'User', index: true },
    broadcast: { type: Boolean, default: false, index: true },
    type: {
      type: String,
      enum: ['new_blog', 'thread_reply', 'thread_like'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
    readBy: [{ type: ObjectId, ref: 'User' }],
    dismissedBy: [{ type: ObjectId, ref: 'User' }],
    blogPost: { type: ObjectId, ref: 'BlogPost' },
    thread: { type: ObjectId, ref: 'ForumThread' },
    actor: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ broadcast: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
