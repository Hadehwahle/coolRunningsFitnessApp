import { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiService, assetUrl } from '@/services/api';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { toast } from 'sonner';
import {
  ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff,
  FileText, Save, X, ChevronDown,
  Upload, Link as LinkIcon, Image as ImageIcon,
} from 'lucide-react';
import type { BlogPost } from '@/types';
import { formatDate } from '@/utils';
import { useSeo } from '@/hooks/useSeo';

// ── Slug generator ────────────────────────────────────────────────────────
function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

// ── Estimate read time ────────────────────────────────────────────────────
function estimateReadTime(content: string) {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

const CATEGORIES = [
  'Beginner Tips', 'Training Plans', 'Nutrition',
  'Injury Prevention', 'Race Reviews', 'Equipment', 'Motivation', 'General',
];

// ── Empty form state ──────────────────────────────────────────────────────
const EMPTY_FORM = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: CATEGORIES[0],
  featuredImage: '',
  tags: '',
  published: false,
  featured: false,
};

type FormState = typeof EMPTY_FORM;

// ── Post Form Component ───────────────────────────────────────────────────

// ── ImageField: URL entry OR direct file upload ───────────────────────────────
function ImageField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep preview in sync when parent changes value (e.g. editing a post)
  useEffect(() => { setPreview(value); }, [value]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setPreview(e.target.value);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const result = await apiService.uploadBlogImage(file);
      // Use the server URL so it persists after save
      onChange(result.url);
      setPreview(result.url);
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
      setPreview(value); // revert preview
      onChange(value);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localUrl);
    }
  };

  const clearImage = () => {
    onChange('');
    setPreview('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-semibold">Featured Image</label>
        {/* Mode toggle */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface2 border border-border text-xs">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-150 ${
              mode === 'url'
                ? 'bg-primary text-background font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            URL
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-150 ${
              mode === 'upload'
                ? 'bg-primary text-background font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Upload className="w-3 h-3" />
            Upload
          </button>
        </div>
      </div>

      {mode === 'url' ? (
        <div className="relative">
          <input
            className="input pr-10"
            placeholder="https://images.unsplash.com/..."
            value={value}
            onChange={handleUrlChange}
          />
          {value && (
            <button
              type="button"
              onClick={clearImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-danger transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
            uploading ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-surface2'
          }`}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={handleFileChange}
          />

          {preview ? (
            <div className="relative group">
              <img
                src={assetUrl(preview)}
                alt="Preview"
                className="w-full h-40 object-cover rounded-xl"
                onError={() => setPreview('')}
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 rounded-xl bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-sm text-foreground hover:border-primary/50 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-primary" />
                  Replace
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearImage(); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-danger/40 text-sm text-danger hover:bg-danger/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
              {uploading && (
                <div className="absolute inset-0 rounded-xl bg-background/80 flex items-center justify-center gap-2">
                  <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
                  <span className="text-sm text-foreground">Uploading…</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground pointer-events-none">
              {uploading ? (
                <>
                  <div className="spinner" style={{ width: 28, height: 28, borderWidth: 2 }} />
                  <span className="text-sm">Uploading…</span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary-soft">
                    <ImageIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Click to upload an image</p>
                    <p className="text-xs mt-0.5">JPEG, PNG, WebP, GIF or AVIF · max 5 MB</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PostForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: FormState;
  onSave: (form: FormState) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [autoSlug, setAutoSlug] = useState(!initial.slug);

  const set = (key: keyof FormState, val: any) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (key === 'title' && autoSlug) {
      setForm((f) => ({ ...f, title: val as string, slug: toSlug(val as string) }));
    }
    if (key === 'content') {
      setForm((f) => ({ ...f, content: val as string, readTime: estimateReadTime(val as string) } as any));
    }
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-semibold mb-1.5">Title *</label>
        <input
          className="input"
          placeholder="Enter post title"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          required
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-semibold mb-1.5">
          Slug *
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            (URL: /blog/{form.slug || 'your-slug'})
          </span>
        </label>
        <input
          className="input font-mono text-sm"
          placeholder="url-friendly-slug"
          value={form.slug}
          onChange={(e) => { setAutoSlug(false); set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
        />
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-semibold mb-1.5">Excerpt *</label>
        <textarea
          className="input resize-none"
          rows={2}
          placeholder="Short summary shown on the blog listing page"
          value={form.excerpt}
          onChange={(e) => set('excerpt', e.target.value)}
        />
      </div>

      {/* Category & Featured Image */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5">Category *</label>
          <div className="relative">
            <select
              className="input appearance-none pr-9"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div>
          <ImageField
            value={form.featuredImage}
            onChange={(url) => set('featuredImage', url)}
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-semibold mb-1.5">
          Tags
          <span className="ml-2 text-xs text-muted-foreground font-normal">comma-separated</span>
        </label>
        <input
          className="input"
          placeholder="running, training, tips"
          value={form.tags}
          onChange={(e) => set('tags', e.target.value)}
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-semibold mb-1.5">
          Content *
          <span className="ml-2 text-xs text-muted-foreground font-normal">HTML supported</span>
        </label>
        <textarea
          className="input resize-y font-mono text-sm leading-relaxed"
          rows={16}
          placeholder="<p>Write your blog post content here...</p>&#10;<h2>Section Heading</h2>&#10;<p>More content...</p>"
          value={form.content}
          onChange={(e) => set('content', e.target.value)}
        />
        {form.content && (
          <p className="text-xs text-muted-foreground mt-1">
            ~{estimateReadTime(form.content)} min read · {form.content.trim().split(/\s+/).length} words
          </p>
        )}
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <button type="button" role="switch" aria-checked={!!form.published} onClick={() => set('published', !form.published)} className={`toggle shrink-0 ${form.published ? 'on' : ''}`}>
            <span className="toggle-thumb" />
          </button>
          <span className="text-sm font-medium">
            {form.published ? 'Published (visible on blog)' : 'Draft (hidden from blog)'}
          </span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <button type="button" role="switch" aria-checked={!!form.featured} onClick={() => set('featured', !form.featured)} className={`toggle shrink-0 ${form.featured ? 'on' : ''}`}>
            <span className="toggle-thumb" />
          </button>
          <span className="text-sm font-medium">Featured post</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button onClick={() => onSave(form)} loading={saving} className="gap-2">
          <Save className="w-4 h-4" />
          Save Post
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          <X className="w-4 h-4 mr-1.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Blog Panel (embeddable in admin dashboard) ────────────────────────────
export function AdminBlogPanel() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await apiService.getAdminBlogPosts(1, 100);
      setPosts(res.items || []);
    } catch {
      toast.error('Failed to load posts — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const formToPayload = (form: FormState) => ({
    title: form.title.trim(),
    slug: form.slug.trim() || toSlug(form.title),
    excerpt: form.excerpt.trim(),
    content: form.content.trim(),
    category: form.category,
    featuredImage: form.featuredImage.trim(),
    tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    published: form.published,
    featured: form.featured,
    readTime: estimateReadTime(form.content),
  });

  const handleCreate = async (form: FormState) => {
    if (!form.title || !form.slug || !form.excerpt || !form.content) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      await apiService.createBlogPost(formToPayload(form));
      toast.success('Post created!');
      setView('list');
      await fetchPosts();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create post');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (form: FormState) => {
    if (!editingPost) return;
    setSaving(true);
    try {
      await apiService.updateBlogPost(editingPost._id, formToPayload(form));
      toast.success('Post updated!');
      setView('list');
      setEditingPost(null);
      await fetchPosts();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setDeleting(post._id);
    try {
      await apiService.deleteBlogPost(post._id);
      toast.success('Post deleted');
      setPosts((p) => p.filter((x) => x._id !== post._id));
    } catch {
      toast.error('Failed to delete post');
    } finally {
      setDeleting(null);
    }
  };

  const startEdit = (post: BlogPost) => {
    setEditingPost(post);
    setView('edit');
  };

  return (
    <div className="py-8 md:py-10">
      <div className="max-w-5xl">

        {/* ── Header bar ── */}
        <div className="flex items-center justify-between mb-8 animate-in">
          <div className="flex items-center gap-3">
            <Link to="/admin" aria-label="Back to admin overview" className="w-11 h-11 rounded-full border border-border flex items-center justify-center hover:bg-surface2 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-[2rem] md:text-[2.5rem] leading-none">
                Blog posts
              </h1>
              <p className="text-sm text-muted-foreground">
                {posts.length} post{posts.length !== 1 ? 's' : ''} · {posts.filter(p => p.published).length} published
              </p>
            </div>
          </div>
          {view === 'list' && (
            <Button onClick={() => setView('create')} className="gap-2">
              <Plus className="w-4 h-4" />
              New Post
            </Button>
          )}
        </div>

        {/* ── Create Form ── */}
        {view === 'create' && (
          <Card className="animate-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold">Create New Post</h2>
            </div>
            <PostForm
              initial={EMPTY_FORM}
              onSave={handleCreate}
              onCancel={() => setView('list')}
              saving={saving}
            />
          </Card>
        )}

        {/* ── Edit Form ── */}
        {view === 'edit' && editingPost && (
          <Card className="animate-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold">Edit Post</h2>
              <Badge variant="info">{editingPost.published ? 'Published' : 'Draft'}</Badge>
            </div>
            <PostForm
              initial={{
                title: editingPost.title,
                slug: editingPost.slug,
                excerpt: editingPost.excerpt,
                content: editingPost.content,
                category: editingPost.category,
                featuredImage: editingPost.featuredImage || '',
                tags: (editingPost.tags || []).join(', '),
                published: editingPost.published,
                featured: editingPost.featured,
              }}
              onSave={handleUpdate}
              onCancel={() => { setView('list'); setEditingPost(null); }}
              saving={saving}
            />
          </Card>
        )}

        {/* ── Post List ── */}
        {view === 'list' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="spinner" />
              </div>
            ) : posts.length === 0 ? (
              <Card className="text-center py-16 animate-in p-6">
                <FileText className="w-12 h-12 text-border mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-6 text-sm">
                  Create your first blog post — it will appear on the public blog immediately when published.
                </p>
                <Button onClick={() => setView('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Post
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <Card key={post._id} className="animate-in">
                    <div className="flex items-start gap-4 p-5">
                      {/* Thumbnail */}
                      {post.featuredImage ? (
                        <img
                          src={assetUrl(post.featuredImage)}
                          alt={post.title}
                          className="w-16 h-16 object-cover flex-shrink-0 hidden sm:block"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-surface border border-border flex items-center justify-center flex-shrink-0 hidden sm:block">
                          <FileText className="w-6 h-6 text-border" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{post.title}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                              /blog/{post.slug}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {post.featured && <Badge variant="warning">Featured</Badge>}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                post.published ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {post.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              {post.published ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{post.excerpt}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{post.category}</span>
                          <span>·</span>
                          <span>{post.readTime} min read</span>
                          <span>·</span>
                          <span>{formatDate(post.createdAt)}</span>
                          {post.views > 0 && <><span>·</span><span>{post.views} views</span></>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Link
                          to={`/blog/${post.slug}`}
                          target="_blank"
                          className="p-2 rounded-lg hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
                          title="View post"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => startEdit(post)}
                          className="p-2 rounded-lg hover:bg-surface text-muted-foreground hover:text-primary transition-colors"
                          title="Edit post"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post)}
                          disabled={deleting === post._id}
                          className="p-2 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors disabled:opacity-40"
                          title="Delete post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Standalone page with auth guard ──────────────────────────────────────
export function AdminBlogPage() {
  useSeo({ title: 'Manage blog posts', noindex: true });
  const { isAdmin, loading: authLoading } = useAuth();
  if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="spinner" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <AdminBlogPanel />;
}
