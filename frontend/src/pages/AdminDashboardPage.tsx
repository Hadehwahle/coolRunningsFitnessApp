import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import {
  Users, FileText, Activity, MessageSquare, Mail,
  TrendingUp, UserCheck, ChevronDown, Trash2, RefreshCw,
  Edit3, X, Eye, EyeOff, Plus, Save, BarChart2, ArrowUpRight, ArrowDownRight, Calendar, Globe,
} from 'lucide-react';
import { apiService, assetUrl } from '@/services/api';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/utils';
import type { User, BlogPost } from '@/types';
import { useSeo } from '@/hooks/useSeo';

// ─────────────────────────────────────────────────────────────────────────────
// ── Users Panel ──────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
function UsersPanel() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; role: 'user' | 'admin'; active: boolean }>({ name: '', role: 'user', active: true });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchUsers = async (p = 1) => {
    setLoading(true);
    try {
      const res = await apiService.getAllUsers(p, 15);
      setUsers(res.items || []);
      setTotalPages(res.pages || 1);
      setTotal(res.total || 0);
      setPage(p);
    } catch (err: any) {
      console.error('[Admin] Failed to load users:', err?.response?.status, err?.message);
      toast.error(err?.response?.data?.message || 'Failed to load users — check your connection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const startEdit = (u: User) => {
    setEditing(u);
    setEditForm({ name: u.name, role: u.role as 'user' | 'admin', active: (u as any).active !== false });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiService.updateUserAdmin(editing._id, editForm);
      toast.success('User updated');
      setEditing(null);
      fetchUsers(page);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (u._id === currentUser?._id) { toast.error("You can't delete yourself"); return; }
    if (!confirm(`Delete "${u.name}"? This cannot be undone.`)) return;
    setDeleting(u._id);
    try {
      await apiService.deleteUserAdmin(u._id);
      toast.success('User deleted');
      fetchUsers(page);
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(null); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> User Management
          <span className="text-sm font-normal text-muted-foreground">({total})</span>
        </h2>
        <button onClick={() => fetchUsers(page)} className="p-2 rounded-lg hover:bg-border transition-colors">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-border w-full max-w-sm animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-display font-bold">Edit User</h3>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-surface">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Name</label>
                <input className="input" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Email <span className="text-xs font-normal text-muted-foreground">(read-only)</span></label>
                <div className="input bg-surface text-muted-foreground cursor-not-allowed">{editing.email}</div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Role</label>
                <div className="relative">
                  <select className="input appearance-none pr-9" value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as 'user' | 'admin' }))}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={editForm.active} onChange={(e) => setEditForm((f) => ({ ...f, active: e.target.checked }))} className="w-4 h-4" />
                <span className="text-sm">Account active</span>
              </label>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <Button onClick={handleSave} loading={saving} className="flex-1">Save</Button>
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : users.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">No users found.</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u._id} className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-surface2 border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-ink text-[rgb(var(--ink-foreground))] flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{u.name}</span>
                    <Badge variant={u.role === 'admin' ? 'warning' : 'info'}>{u.role}</Badge>
                    {(u as any).active === false && <Badge variant="danger">Inactive</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground truncate block">{u.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => startEdit(u)} className="p-2 rounded-lg hover:bg-surface text-muted-foreground hover:text-primary transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(u)}
                  disabled={deleting === u._id || u._id === currentUser?._id}
                  className="p-2 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button variant="secondary" size="sm" onClick={() => fetchUsers(page - 1)} disabled={page === 1}>Prev</Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="secondary" size="sm" onClick={() => fetchUsers(page + 1)} disabled={page === totalPages}>Next</Button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Blog Panel ───────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
const BLOG_CATEGORIES = ['Beginner Tips', 'Training Plans', 'Nutrition', 'Injury Prevention', 'Race Reviews', 'Equipment', 'Motivation', 'General'];

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80);
}

function estimateReadTime(content: string) {
  return Math.max(1, Math.round(content.trim().split(/\s+/).length / 200));
}

type BlogFormState = {
  title: string; slug: string; excerpt: string; content: string;
  category: string; featuredImage: string; tags: string;
  published: boolean; featured: boolean;
};

const EMPTY_BLOG_FORM: BlogFormState = {
  title: '', slug: '', excerpt: '', content: '',
  category: BLOG_CATEGORIES[0], featuredImage: '', tags: '',
  published: false, featured: false,
};

// ── Standalone BlogForm — must be outside BlogPanel to prevent re-mount on render ──
function BlogForm({
  form,
  setField,
  view,
  saving,
  onSubmit,
  onCancel,
}: {
  form: BlogFormState;
  setField: (k: keyof BlogFormState, v: any) => void;
  view: 'create' | 'edit';
  saving: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5">Title *</label>
          <input className="input" placeholder="Post title" value={form.title} onChange={(e) => setField('title', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5">
            Slug <span className="text-xs font-normal text-muted-foreground">/blog/{form.slug || '…'}</span>
          </label>
          <input className="input font-mono text-sm" placeholder="url-slug" value={form.slug} onChange={(e) => setField('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">Excerpt *</label>
        <textarea className="input resize-none" rows={2} placeholder="Short summary shown in the blog listing" value={form.excerpt} onChange={(e) => setField('excerpt', e.target.value)} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5">Category *</label>
          <div className="relative">
            <select className="input appearance-none pr-9" value={form.category} onChange={(e) => setField('category', e.target.value)}>
              {BLOG_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5">Featured Image URL</label>
          <input className="input" placeholder="https://images.unsplash.com/…" value={form.featuredImage} onChange={(e) => setField('featuredImage', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">Tags <span className="text-xs font-normal text-muted-foreground">comma-separated</span></label>
        <input className="input" placeholder="running, tips, beginners" value={form.tags} onChange={(e) => setField('tags', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">
          Content * <span className="text-xs font-normal text-muted-foreground">HTML supported · ~{estimateReadTime(form.content)} min read</span>
        </label>
        <textarea className="input resize-y font-mono text-sm leading-relaxed" rows={14} placeholder="<p>Write your article here…</p>" value={form.content} onChange={(e) => setField('content', e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-6 pt-1">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <button type="button" role="switch" aria-checked={!!form.published} onClick={() => setField('published', !form.published)} className={`toggle shrink-0 ${form.published ? 'on' : ''}`}>
            <span className="toggle-thumb" />
          </button>
          <span className="text-sm font-medium">{form.published ? 'Published' : 'Draft'}</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <button type="button" role="switch" aria-checked={!!form.featured} onClick={() => setField('featured', !form.featured)} className={`toggle shrink-0 ${form.featured ? 'on' : ''}`}>
            <span className="toggle-thumb" />
          </button>
          <span className="text-sm font-medium">Featured post</span>
        </label>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={onSubmit} loading={saving} className="gap-2">
          <Save className="w-4 h-4" /> {view === 'create' ? 'Create Post' : 'Save Changes'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Blog Panel ───────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
function BlogPanel() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<BlogFormState>(EMPTY_BLOG_FORM);
  const [autoSlug, setAutoSlug] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await apiService.getAdminBlogPosts(1, 100);
      setPosts(res.items || []);
    } catch (err: any) {
      console.error('[Admin] Failed to load posts:', err?.response?.status, err?.message);
      toast.error(err?.response?.data?.message || 'Failed to load posts — check your connection');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const setField = (k: keyof BlogFormState, v: any) => {
    setForm((f) => {
      const updated = { ...f, [k]: v };
      if (k === 'title' && autoSlug) updated.slug = toSlug(v);
      return updated;
    });
  };

  const buildPayload = () => ({
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

  const handleCreate = async () => {
    if (!form.title || !form.excerpt || !form.content) { toast.error('Title, excerpt and content are required'); return; }
    setSaving(true);
    try {
      await apiService.createBlogPost(buildPayload());
      toast.success('Post created!');
      setView('list');
      fetchPosts();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to create'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editingPost) return;
    setSaving(true);
    try {
      await apiService.updateBlogPost(editingPost._id, buildPayload());
      toast.success('Post updated!');
      setView('list');
      setEditingPost(null);
      fetchPosts();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const startEdit = (post: BlogPost) => {
    setEditingPost(post);
    setAutoSlug(false);
    setForm({
      title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content,
      category: post.category, featuredImage: post.featuredImage || '',
      tags: (post.tags || []).join(', '),
      published: post.published, featured: post.featured,
    });
    setView('edit');
  };

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Delete "${post.title}"?`)) return;
    setDeleting(post._id);
    try {
      await apiService.deleteBlogPost(post._id);
      toast.success('Deleted');
      setPosts((p) => p.filter((x) => x._id !== post._id));
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const startCreate = () => { setForm(EMPTY_BLOG_FORM); setAutoSlug(true); setEditingPost(null); setView('create'); };
  const cancel = () => { setView('list'); setEditingPost(null); };

  // ── List UI ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> Blog Posts
          <span className="text-sm font-normal text-muted-foreground">({posts.length})</span>
        </h2>
        <div className="flex gap-2">
          <button onClick={fetchPosts} className="p-2 rounded-lg hover:bg-border transition-colors">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
          {view === 'list' && (
            <Button onClick={startCreate} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> New Post
            </Button>
          )}
        </div>
      </div>

      {(view === 'create' || view === 'edit') && (
        <div className="bg-surface2 border border-border p-5 mb-4">
          <h3 className="font-display font-bold mb-4">{view === 'create' ? 'Create New Post' : `Editing: ${editingPost?.title}`}</h3>
          <BlogForm
            form={form}
            setField={setField}
            view={view}
            saving={saving}
            onSubmit={view === 'create' ? handleCreate : handleUpdate}
            onCancel={cancel}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 text-border" />
          <p>No posts yet. Create your first post above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div key={post._id} className="flex items-start gap-3 p-4 bg-surface2 border border-border hover:border-primary/30 transition-colors">
              {post.featuredImage && (
                <img src={assetUrl(post.featuredImage)} alt={post.title} className="w-14 h-14 rounded-lg object-cover flex-shrink-0 hidden sm:block" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-semibold text-sm">{post.title}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">/blog/{post.slug}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {post.featured && <Badge variant="warning">Featured</Badge>}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${post.published ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {post.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {post.published ? 'Live' : 'Draft'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span>{post.category}</span>
                  <span>·</span>
                  <span>{post.readTime} min</span>
                  <span>·</span>
                  <span>{formatRelativeTime(post.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Link to={`/blog/${post.slug}`} target="_blank" className="p-2 rounded-lg hover:bg-surface text-muted-foreground hover:text-foreground transition-colors" title="Preview">
                  <Eye className="w-4 h-4" />
                </Link>
                <button onClick={() => startEdit(post)} className="p-2 rounded-lg hover:bg-surface text-muted-foreground hover:text-primary transition-colors" title="Edit">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(post)} disabled={deleting === post._id} className="p-2 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors disabled:opacity-40" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Contact Panel ────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
function ContactPanel() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchMessages = async (p = 1) => {
    setLoading(true);
    try {
      const res = await apiService.getContactMessages(p, 20);
      setMessages(res.items || []);
      setTotalPages(res.pages || 1);
      setPage(p);
    } catch (err: any) {
      console.error('[Admin] Failed to load messages:', err?.response?.status, err?.message);
      toast.error(err?.response?.data?.message || 'Failed to load messages — check your connection');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMessages(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-bold flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" /> Contact Messages
        </h2>
        <button onClick={() => fetchMessages(page)} className="p-2 rounded-lg hover:bg-border transition-colors">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Mail className="w-10 h-10 mx-auto mb-3 text-border" />
          <p>No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg._id} className="bg-surface2 border border-border overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === msg._id ? null : msg._id)}
                className="w-full flex items-center justify-between p-4 hover:bg-surface transition-colors text-left text-foreground"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-primary/10 flex items-center justify-center text-primary text-sm font-bold font-mono flex-shrink-0">
                    {msg.name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{msg.name}</span>
                      <span className="text-xs text-muted-foreground truncate hidden sm:block">{msg.email}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{msg.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatRelativeTime(msg.createdAt)}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded === msg._id ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {expanded === msg._id && (
                <div className="px-4 pb-4 border-t border-border">
                  <p className="text-sm font-semibold mt-3 mb-1">{msg.subject}</p>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  <a
                    href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                    className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline font-medium"
                  >
                    <Mail className="w-4 h-4" /> Reply via email
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button variant="secondary" size="sm" onClick={() => fetchMessages(page - 1)} disabled={page === 1}>Prev</Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="secondary" size="sm" onClick={() => fetchMessages(page + 1)} disabled={page === totalPages}>Next</Button>
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// ── Analytics Panel ──────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
type AnalyticsData = {
  weeklyData: { day: string; date: string; runs: number; distance: number }[];
  userGrowth: { month: string; year: number; newUsers: number; totalUsers: number }[];
  categories: { name: string; count: number; pct: number }[];
};

const CATEGORY_COLORS: Record<string, string> = {
  'General Discussion':  'rgb(var(--primary))',
  'Training & Technique':'#2F7D6D',
  'Races & Events':      '#3D6FB0',
  'Gear & Equipment':    '#8A6BB8',
  'Nutrition & Health':  '#B58A1E',
  'Motivation & Support':'#B5506A',
};

function AnalyticsPanel({ stats, statsLoading }: { stats: any; statsLoading: boolean }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiService.getAnalytics();
        setAnalytics(data);
      } catch (err: any) {
        console.error('[Admin] Failed to load analytics:', err?.response?.status, err?.message);
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalUsers  = stats?.totalUsers      ?? 0;
  const totalRuns   = stats?.totalRuns        ?? 0;
  const totalPosts  = stats?.totalBlogPosts   ?? 0;
  const totalThreads= stats?.totalThreads     ?? 0;

  // KPI change vs previous month derived from live userGrowth data
  const growthData = analytics?.userGrowth ?? [];
  const lastMonth  = growthData[growthData.length - 2]?.newUsers ?? 0;
  const thisMonth  = growthData[growthData.length - 1]?.newUsers ?? 0;
  const userChange = lastMonth > 0
    ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1)
    : null;

  const weeklyData  = analytics?.weeklyData  ?? [];
  const userGrowth  = analytics?.userGrowth  ?? [];
  const categories  = analytics?.categories  ?? [];
  const maxRuns     = Math.max(...weeklyData.map(d => d.runs), 1);
  const maxUsers    = Math.max(...userGrowth.map(d => d.totalUsers), 1);

  const kpis = [
    { label: 'Total Users',   value: totalUsers.toLocaleString(),  change: userChange ? `${userChange}%` : '—', up: userChange === null || parseFloat(userChange) >= 0, icon: Users,        color: 'text-primary', bg: 'bg-primary/10', desc: 'new this month: ' + thisMonth },
    { label: 'Runs Logged',   value: totalRuns.toLocaleString(),   change: '—', up: true, icon: Activity,      color: 'text-success', bg: 'bg-success/10', desc: 'all time' },
    { label: 'Blog Posts',    value: totalPosts.toLocaleString(),  change: '—', up: true, icon: FileText,      color: 'text-info',    bg: 'bg-info/10',    desc: 'published' },
    { label: 'Forum Threads', value: totalThreads.toLocaleString(),change: '—', up: true, icon: MessageSquare, color: 'text-warning',  bg: 'bg-warning/10', desc: 'community threads' },
  ];

  if (loading || statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading analytics…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-primary" /> Platform Analytics
        </h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>Live data</span>
          {error && <span className="text-warning ml-2">(charts unavailable)</span>}
        </div>
      </div>

      {/* KPI Cards — always live from stats endpoint */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                {kpi.change !== '—' && (
                  <div className={`flex items-center gap-1 text-xs font-semibold ${kpi.up ? 'text-success' : 'text-danger'}`}>
                    {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {kpi.change}
                  </div>
                )}
              </div>
              <div className="stat-num text-3xl">{statsLoading ? '—' : kpi.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
              <div className="text-xs text-muted-foreground/50 mt-0.5">{kpi.desc}</div>
            </div>
          );
        })}
      </div>

      {error ? (
        <div className="card p-6 text-center text-sm text-muted-foreground">
          <BarChart2 className="w-8 h-8 text-border mx-auto mb-3" />
          <p>Chart data couldn't be loaded. KPI numbers above are still accurate.</p>
          <p className="text-xs mt-1 text-muted-foreground/50">Check the browser console for details.</p>
        </div>
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Weekly Run Activity — live from /admin/analytics */}
            <div className="card p-5">
              <h3 className="font-bold text-lg mb-1">Daily Runs — Last 7 Days</h3>
              <p className="text-xs text-muted-foreground mb-5">Runs logged each day this week (live)</p>
              {weeklyData.length === 0 || weeklyData.every(d => d.runs === 0) ? (
                <div className="flex items-center justify-center h-36 text-sm text-muted-foreground">No run data yet</div>
              ) : (
                <div className="flex items-end gap-2 h-36">
                  {weeklyData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full rounded-t-md relative group" style={{
                        height: `${Math.max((d.runs / maxRuns) * 120, d.runs > 0 ? 4 : 0)}px`,
                        background: 'rgb(var(--primary))',
                        minHeight: d.runs > 0 ? '4px' : '0',
                        transition: 'height 0.5s ease',
                      }}>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface border border-border rounded px-2 py-1 text-xs text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {d.runs} run{d.runs !== 1 ? 's' : ''}<br />
                          <span className="text-muted-foreground">{d.distance} km</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{d.day}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Growth — live from /admin/analytics */}
            <div className="card p-5">
              <h3 className="font-bold text-lg mb-1">User Growth</h3>
              <p className="text-xs text-muted-foreground mb-5">Cumulative signups — last 6 months (live)</p>
              {userGrowth.length < 2 ? (
                <div className="flex items-center justify-center h-36 text-sm text-muted-foreground">Not enough data yet</div>
              ) : (
                <div className="relative" style={{ height: '144px' }}>
                  <svg viewBox="0 0 300 110" className="w-full" style={{ height: '110px' }} preserveAspectRatio="none">
                    <path
                      d={`M0,${110 - (userGrowth[0].totalUsers / maxUsers) * 90} ` +
                        userGrowth.map((d, i) => `L${(i / (userGrowth.length - 1)) * 300},${110 - (d.totalUsers / maxUsers) * 90}`).join(' ') +
                        ` L300,110 L0,110 Z`}
                      fill="rgb(var(--primary) / 0.12)"
                    />
                    <path
                      d={`M0,${110 - (userGrowth[0].totalUsers / maxUsers) * 90} ` +
                        userGrowth.map((d, i) => `L${(i / (userGrowth.length - 1)) * 300},${110 - (d.totalUsers / maxUsers) * 90}`).join(' ')}
                      fill="none" stroke="rgb(var(--primary))" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"
                    />
                    {userGrowth.map((d, i) => (
                      <circle key={i}
                        cx={(i / (userGrowth.length - 1)) * 300}
                        cy={110 - (d.totalUsers / maxUsers) * 90}
                        r="4" fill="rgb(var(--primary))" stroke="rgb(var(--surface))" strokeWidth="2"
                      />
                    ))}
                  </svg>
                  <div className="flex justify-between mt-1">
                    {userGrowth.map((d, i) => (
                      <span key={i} className="text-xs text-muted-foreground">{d.month}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Forum category breakdown — live */}
            <div className="card p-5">
              <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" /> Discussion Categories
              </h3>
              <p className="text-xs text-muted-foreground mb-5">Thread distribution across topics (live)</p>
              {categories.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">No forum threads yet</div>
              ) : (
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground/80">{cat.name}</span>
                        <span className="text-xs font-semibold text-foreground/60">{cat.pct}% <span className="text-muted-foreground/40">({cat.count})</span></span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface3 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${cat.pct}%`, background: CATEGORY_COLORS[cat.name] ?? 'rgb(var(--primary))' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Platform health — computed from live stats */}
            <div className="card p-5">
              <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" /> Platform Health
              </h3>
              <p className="text-xs text-muted-foreground mb-5">Key indicators from live data</p>
              <div className="space-y-4">
                {[
                  { label: 'Avg runs per user',  value: totalUsers > 0 ? (totalRuns   / totalUsers).toFixed(1)               : '—', note: 'lifetime average',         icon: Activity       },
                  { label: 'Blog engagement',    value: totalUsers > 0 ? (totalPosts  / totalUsers * 100).toFixed(1) + '%'    : '—', note: 'of users have a blog post', icon: FileText       },
                  { label: 'Forum engagement',   value: totalUsers > 0 ? (totalThreads/ totalUsers * 100).toFixed(1) + '%'    : '—', note: 'of users started a thread', icon: MessageSquare  },
                  { label: 'Newsletter subs',    value: stats?.newsletterSubscribers?.toLocaleString() ?? '—',                       note: 'email subscribers',          icon: Mail           },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium text-foreground">{item.label}</div>
                          <div className="text-xs text-muted-foreground">{item.note}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-primary">{statsLoading ? '—' : item.value}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// ── Main Admin Dashboard ─────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'users' | 'blog' | 'contact' | 'analytics';

export function AdminDashboardPage() {
  useSeo({ title: 'Admin dashboard', noindex: true });
  const { isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      setStatsLoading(true);
      try {
        const [s, a] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getRecentActivity(),
        ]);
        setStats(s);
        setActivity(Array.isArray(a) ? a : []);
      } catch { /* no backend — leave stats as null */ }
      finally { setStatsLoading(false); }
    };
    load();
  }, [isAdmin]);

  if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="spinner" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Runs', value: stats?.totalRuns ?? '—', icon: Activity, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Blog Posts', value: stats?.totalBlogPosts ?? '—', icon: FileText, color: 'text-info', bg: 'bg-info/10' },
    { label: 'Forum Threads', value: stats?.totalThreads ?? '—', icon: MessageSquare, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Newsletter', value: stats?.newsletterSubscribers ?? '—', icon: Mail, color: 'text-gold', bg: 'bg-gold/10' },
  ];

  const activityIcons: Record<string, any> = { user: UserCheck, run: TrendingUp, blog: FileText, forum: MessageSquare };
  const activityColors: Record<string, string> = {
    user: 'text-success bg-success/10', run: 'text-info bg-info/10',
    blog: 'text-primary bg-primary/10', forum: 'text-warning bg-warning/10',
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'blog', label: 'Blog', icon: FileText },
    { id: 'contact', label: 'Contact', icon: Mail },
  ];

  return (
    <div className="py-8 md:py-10">
      <div>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-tag">Admin</p>
            <h1 className="mt-2 text-[2.25rem] md:text-[2.75rem] leading-none">Overview</h1>
            <p className="text-muted-foreground mt-2">Manage the CoolRunnings platform.</p>
          </div>
          <Link to="/settings" className="btn btn-secondary btn-sm gap-2">
            <UserCheck className="w-4 h-4" /> My Settings
          </Link>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Admin sections" className="-mx-4 px-4 sm:mx-0 sm:px-0 mb-8 flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold border transition-colors ${
                activeTab === id ? 'bg-ink text-[rgb(var(--ink-foreground))] border-transparent' : 'bg-surface border-border text-foreground/75 hover:bg-surface2'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {statCards.map((s, i) => {
                const Icon = s.icon;
                return (
                  <Card key={i} className="animate-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <CardContent className="p-4">
                      <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                        <Icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <div className="stat-num text-3xl">{statsLoading ? '—' : s.value}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { tab: 'analytics' as Tab, icon: BarChart2, color: 'text-primary bg-primary/10', label: 'Analytics', sub: 'Platform metrics and trends' },
                { tab: 'blog' as Tab, icon: FileText, color: 'text-info bg-info/10', label: 'Manage Blog', sub: 'Create, edit, delete posts' },
                { tab: 'users' as Tab, icon: Users, color: 'text-success bg-success/10', label: 'Manage Users', sub: 'Edit roles, deactivate accounts' },
                { tab: 'contact' as Tab, icon: Mail, color: 'text-warning bg-warning/10', label: 'Contact Messages', sub: 'Read & respond to enquiries' },
              ].map(({ tab, icon: Icon, color, label, sub }) => (
                <div
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="bg-surface2 border border-border rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 select-none"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Live activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  <Badge variant="success">Live</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex justify-center py-8"><div className="spinner" /></div>
                ) : activity.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">No recent activity yet.</p>
                ) : (
                  <div className="space-y-2">
                    {activity.map((item, i) => {
                      const Icon = activityIcons[item.type] || TrendingUp;
                      const color = activityColors[item.type] || 'text-primary bg-primary/10';
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 hover:bg-surface transition-colors">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{item.action}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                            {formatRelativeTime(item.time)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Analytics tab ── */}
        {activeTab === 'analytics' && (
          <div className="animate-fade-in">
            <AnalyticsPanel stats={stats} statsLoading={statsLoading} />
          </div>
        )}

        {/* ── Users tab ── */}
        {activeTab === 'users' && (
          <Card className="animate-in">
            <CardContent className="p-6">
              <UsersPanel />
            </CardContent>
          </Card>
        )}

        {/* ── Blog tab ── */}
        {activeTab === 'blog' && (
          <Card className="animate-in">
            <CardContent className="p-6">
              <BlogPanel />
            </CardContent>
          </Card>
        )}

        {/* ── Contact tab ── */}
        {activeTab === 'contact' && (
          <Card className="animate-in">
            <CardContent className="p-6">
              <ContactPanel />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
