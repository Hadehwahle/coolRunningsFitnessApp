import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [5000, 'Reply cannot exceed 5000 characters'],
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

const forumThreadSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [5000, 'Content cannot exceed 5000 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'General Discussion',
        'Training & Technique',
        'Races & Events',
        'Gear & Equipment',
        'Nutrition & Health',
        'Motivation & Support',
      ],
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    locked: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    replies: [replySchema],
    tags: [{
      type: String,
      trim: true,
    }],
    // Last reply or creation time. The forum is sorted by this, not updatedAt,
    // so views and likes don't reorder the list.
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
forumThreadSchema.index({ category: 1, pinned: -1, lastActivityAt: -1 });
forumThreadSchema.index({ pinned: -1, lastActivityAt: -1 });
forumThreadSchema.index({ author: 1 });

// Virtual for reply count
forumThreadSchema.virtual('replyCount').get(function () {
  return this.replies.length;
});

const ForumThread = mongoose.model('ForumThread', forumThreadSchema);

export default ForumThread;
