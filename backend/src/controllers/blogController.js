import slugify from 'slugify';
import BlogPost from '../models/BlogPost.js';
import { emitTo } from '../socket.js';
import { asyncHandler } from '../middleware/error.js';
import { notifyNewBlogPost } from '../utils/notifications.js';

// Fields an admin may set. views, author, slug, publishedAt and comments are
// controlled by the server (previously the whole body was merged into the post).
const EDITABLE = ['title', 'excerpt', 'content', 'category', 'tags', 'readTime', 'published', 'featured', 'featuredImage'];

function pick(body) {
  const out = {};
  for (const k of EDITABLE) if (body[k] !== undefined) out[k] = body[k];
  if (typeof out.tags === 'string') out.tags = out.tags.split(',').map((t) => t.trim()).filter(Boolean);
  return out;
}

// Estimate read time from the HTML content (~200 words per minute)
function estimateReadTime(html = '') {
  const words = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Slug from the title; adds -2, -3… if another post already uses it
// (two posts with the same title used to crash with a duplicate-key error).
async function uniqueSlug(title, excludeId) {
  const base = slugify(title, { lower: true, strict: true }) || 'post';
  let slug = base;
  let n = 2;
  while (await BlogPost.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

const LIST_FIELDS = '-content -comments';

// @route GET /api/blog
export const getBlogPosts = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const query = { published: true };
  if (req.query.category) query.category = String(req.query.category);

  const [items, total] = await Promise.all([
    BlogPost.find(query)
      .select(LIST_FIELDS)
      .populate('author', 'name avatar')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    BlogPost.countDocuments(query),
  ]);

  res.json({ success: true, data: { items, page, pages: Math.max(Math.ceil(total / limit), 1), total } });
});

// @route GET /api/blog/:slug
// Drafts are only visible to admins (they used to be readable by anyone with the URL).
export const getBlogPost = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  const post = await BlogPost.findOne({ slug: req.params.slug, ...(isAdmin ? {} : { published: true }) })
    .populate('author', 'name avatar bio');

  if (!post) return res.status(404).json({ success: false, message: 'Blog post not found' });

  if (post.published) {
    // Count the view without touching updatedAt
    await BlogPost.updateOne({ _id: post._id }, { $inc: { views: 1 } }, { timestamps: false });
  }

  const related = await BlogPost.find({ published: true, category: post.category, _id: { $ne: post._id } })
    .select('title slug excerpt featuredImage readTime category publishedAt createdAt')
    .sort({ publishedAt: -1 })
    .limit(3)
    .lean();

  res.json({ success: true, data: { ...post.toObject(), related } });
});

// @route GET /api/blog/featured
export const getFeaturedPosts = asyncHandler(async (req, res) => {
  const posts = await BlogPost.find({ published: true, featured: true })
    .select(LIST_FIELDS)
    .populate('author', 'name avatar')
    .sort({ publishedAt: -1 })
    .limit(5);
  res.json({ success: true, data: posts });
});

// @route GET /api/admin/blog  (includes drafts)
export const getAllBlogPostsAdmin = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const [items, total] = await Promise.all([
    BlogPost.find({}).populate('author', 'name avatar').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    BlogPost.countDocuments({}),
  ]);
  res.json({ success: true, data: { items, page, pages: Math.max(Math.ceil(total / limit), 1), total } });
});

// @route POST /api/admin/blog
export const createBlogPost = asyncHandler(async (req, res) => {
  const data = pick(req.body);
  data.author = req.user._id;
  data.slug = await uniqueSlug(data.title);
  if (!data.readTime) data.readTime = estimateReadTime(data.content);

  const post = await BlogPost.create(data);
  await post.populate('author', 'name avatar');

  if (post.published) {
    emitTo('blog', 'new-post', post.toObject());
    notifyNewBlogPost(post, req.user._id);
  }
  res.status(201).json({ success: true, data: post });
});

// @route PUT /api/admin/blog/:id
export const updateBlogPost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Blog post not found' });

  const wasPublished = post.published;
  const data = pick(req.body);
  if (data.title && data.title !== post.title) data.slug = await uniqueSlug(data.title, post._id);
  if (data.content && !req.body.readTime) data.readTime = estimateReadTime(data.content);
  Object.assign(post, data);

  await post.save();
  await post.populate('author', 'name avatar');

  if (post.published && !wasPublished) {
    // Newly published: announce it once
    emitTo('blog', 'new-post', post.toObject());
    notifyNewBlogPost(post, req.user._id);
  } else if (post.published) {
    // Edit to an already-live post: update it in place on open blog pages
    emitTo('blog', 'post-updated', post.toObject());
  } else if (wasPublished) {
    emitTo('blog', 'post-removed', { _id: post._id });
  }

  res.json({ success: true, data: post });
});

// @route DELETE /api/admin/blog/:id
export const deleteBlogPost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findByIdAndDelete(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Blog post not found' });
  emitTo('blog', 'post-removed', { _id: post._id });
  res.json({ success: true, message: 'Blog post deleted successfully' });
});
