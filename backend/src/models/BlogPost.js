import mongoose from 'mongoose';
import slugify from 'slugify';

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
  },
  { timestamps: true }
);

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      minlength: [10, 'Excerpt must be at least 10 characters'],
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [50000, 'Content cannot exceed 50000 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    featuredImage: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Beginner Tips',
        'Training Plans',
        'Nutrition',
        'Injury Prevention',
        'Race Reviews',
        'Equipment',
        'Motivation',
        'General',
      ],
    },
    tags: [{
      type: String,
      trim: true,
    }],
    readTime: {
      type: Number,
      required: true,
      min: 1,
    },
    published: {
      type: Boolean,
      default: false,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
    },
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

// Generate slug from title before saving
blogPostSchema.pre('save', function (next) {
  // Only auto-generate slug from title if:
  // 1. The title changed AND
  // 2. The slug was NOT explicitly set in the same operation (i.e. slug wasn't modified too)
  if (this.isModified('title') && !this.isModified('slug')) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }
  
  if (this.isModified('published') && this.published && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Indexes
blogPostSchema.index({ published: 1, publishedAt: -1 });
blogPostSchema.index({ published: 1, createdAt: -1 });
blogPostSchema.index({ category: 1, published: 1 });
blogPostSchema.index({ featured: 1, published: 1 });

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

export default BlogPost;
