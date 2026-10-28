import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  MessageSquare, TrendingUp, Calendar, Activity, Users, Heart, Plus, X, ArrowLeft,
  Send, ChevronDown, Clock, Eye, Pin, Lock, Trash2, LayoutGrid,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/Button';
import { apiService } from '@/services/api';
import { useSocketRoom } from '@/hooks/useSocket';
import { formatRelativeTime, cn } from '@/utils';
import { useSeo, SITE_URL } from '@/hooks/useSeo';
import { EmptyState, Skeleton } from '@/components/ui';

const CATEGORIES = [
  'General Discussion',
  'Training & Technique',
  'Races & Events',
  'Gear & Equipment',
  'Nutrition & Health',
  'Motivation & Support',
];

const CATEGORY_META: Record<string, { icon: typeof MessageSquare; tone: string; desc: string }> = {
  'General Discussion': { icon: MessageSquare, tone: 'text-info bg-info/10', desc: 'Anything running-related' },
  'Training & Technique': { icon: TrendingUp, tone: 'text-primary bg-primary/10', desc: 'Form, plans, workouts and progress' },
  'Races & Events': { icon: Calendar, tone: 'text-success bg-success/10', desc: 'Race reports and upcoming events' },
  'Gear & Equipment': { icon: Activity, tone: 'text-warning bg-warning/10', desc: 'Shoes, watches and kit' },
  'Nutrition & Health': { icon: Users, tone: 'text-danger bg-danger/10', desc: 'Fuelling, recovery and injuries' },
  'Motivation & Support': { icon: Heart, tone: 'text-foreground bg-surface3', desc: 'Celebrate wins, share struggles' },
};
const metaOf = (c: string) => CATEGORY_META[c] || CATEGORY_META['General Discussion'];

const Avatar = ({ name, size = 'w-9 h-9 text-sm' }: { name?: string; size?: string }) => (
  <span className={cn('rounded-full bg-ink text-[rgb(var(--ink-foreground))] flex items-center justify-center font-bold shrink-0', size)}>
    {name?.charAt(0)?.toUpperCase() || '?'}
  </span>
);

// ── Thread View ────────────────────────────────────────────────────────────
function ThreadView({ threadId, onBack }: { threadId: string; onBack: () => void }) {
  const { user } = useAuth();
  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [likingThread, setLikingThread] = useState(false);

  const loadThread = async () => {
    setLoading(true);
    try {
      setThread(await apiService.getThread(threadId));
    } catch {
      setThread(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadThread(); }, [threadId]);

  const handleNewReply = useCallback((newReply: any) => {
    setThread((prev: any) => {
      if (!prev || prev.replies?.some((r: any) => r._id === newReply._id)) return prev;
      return { ...prev, replies: [...(prev.replies || []), newReply] };
    });
  }, []);
  const handleThreadLiked = useCallback(({ likes }: { threadId: string; likes: string[] }) => {
    setThread((prev: any) => (prev ? { ...prev, likes } : prev));
  }, []);
  const handleReplyRemoved = useCallback(({ replyId }: { replyId: string }) => {
    setThread((prev: any) => (prev ? { ...prev, replies: (prev.replies || []).filter((r: any) => r._id !== replyId) } : prev));
  }, []);

  useSocketRoom(`thread:${threadId}`, 'join-thread', 'leave-thread', threadId, {
    'new-reply': handleNewReply,
    'thread-liked': handleThreadLiked,
    'reply-removed': handleReplyRemoved,
  });

  // Each discussion gets its own title, description and structured data
  useSeo({
    title: thread?.title || 'Discussion',
    description: thread?.content ? String(thread.content).slice(0, 155) : undefined,
    jsonLd: thread ? {
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      headline: thread.title,
      text: String(thread.content || '').slice(0, 500),
      url: `${SITE_URL}/community/thread/${thread._id}`,
      datePublished: thread.createdAt,
      author: { '@type': 'Person', name: thread.author?.name || 'Runner' },
      interactionStatistic: [
        { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: thread.replies?.length || 0 },
        { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: thread.likes?.length || 0 },
      ],
    } : null,
  });

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Delete this reply?')) return;
    try {
      await apiService.deleteReply(threadId, replyId);
      handleReplyRemoved({ replyId });
      toast.success('Reply deleted');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not delete reply');
    }
  };

  const handleLikeThread = async () => {
    if (!user) { toast.error('Sign in to like discussions'); return; }
    setLikingThread(true);
    try {
      const { likes } = await apiService.likeThread(threadId);
      setThread((prev: any) => (prev ? { ...prev, likes } : prev));
    } catch { toast.error('Could not like this discussion'); }
    finally { setLikingThread(false); }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const newReply = await apiService.addReply(threadId, replyText.trim());
      setReplyText('');
      handleNewReply(newReply);
      toast.success('Reply posted');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not post your reply');
    } finally { setSending(false); }
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-6 w-40" /><Skeleton className="h-64" /><Skeleton className="h-28" /><Skeleton className="h-28" />
      </div>
    );
  }
  if (!thread) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl">Discussion not found</h1>
        <p className="text-muted-foreground mt-2">It may have been deleted.</p>
        <button onClick={onBack} className="btn btn-secondary mt-6"><ArrowLeft className="w-4 h-4" /> Back to discussions</button>
      </div>
    );
  }

  const likeCount = thread.likes?.length || 0;
  const hasLiked = Boolean(user && thread.likes?.some((id: any) => String(id) === user._id));
  const meta = metaOf(thread.category);
  const Icon = meta.icon;
  const replies = thread.replies || [];

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 py-2">
        <ArrowLeft className="w-4 h-4" /> All discussions
      </button>

      <article className="card p-0 overflow-hidden">
        <div className="px-5 sm:px-7 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <span className="flex items-center gap-2.5">
            <span className={cn('w-8 h-8 rounded-xl flex items-center justify-center', meta.tone)}><Icon className="w-4 h-4" /></span>
            <span className="text-sm font-semibold">{thread.category}</span>
            {thread.pinned && <span className="badge badge-warning"><Pin className="w-3 h-3" />Pinned</span>}
            {thread.locked && <span className="badge badge-danger"><Lock className="w-3 h-3" />Locked</span>}
          </span>
          <span className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{thread.views}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatRelativeTime(thread.createdAt)}</span>
          </span>
        </div>
        <div className="p-5 sm:p-7">
          <h1 className="text-[1.75rem] sm:text-[2.25rem] leading-tight">{thread.title}</h1>
          <div className="flex items-center gap-3 mt-5">
            <Avatar name={thread.author?.name} size="w-10 h-10" />
            <div>
              <p className="font-semibold">{thread.author?.name || 'Runner'}</p>
              {thread.author?.bio && <p className="text-sm text-muted-foreground">{thread.author.bio}</p>}
            </div>
          </div>
          <p className="mt-6 text-[17px] leading-relaxed text-foreground/85 whitespace-pre-wrap">{thread.content}</p>
          <button onClick={handleLikeThread} disabled={likingThread} aria-pressed={hasLiked}
            className={cn('mt-6 inline-flex items-center gap-2 h-11 px-4 rounded-full text-sm font-semibold border transition-colors disabled:opacity-60',
              hasLiked ? 'bg-primary-soft text-primary border-transparent' : 'border-border hover:bg-surface2')}>
            <Heart className={cn('w-4 h-4', hasLiked && 'fill-current')} />
            {likeCount > 0 ? `${likeCount} ${likeCount === 1 ? 'like' : 'likes'}` : 'Like'}
          </button>
        </div>
      </article>

      <h2 className="text-xl mt-10 mb-4 flex items-center gap-2" style={{ fontStretch: '108%' }}>
        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
      </h2>

      {replies.length === 0 ? (
        <div className="card text-center text-muted-foreground py-10">No replies yet. Be the first to help out.</div>
      ) : (
        <ol className="space-y-3">
          {replies.map((r: any) => (
            <li key={r._id} className="card p-5 flex gap-3.5 animate-slide-up">
              <Avatar name={r.author?.name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{r.author?.name || 'Runner'}</p>
                  <span className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(r.createdAt)}</span>
                    {user && (user.role === 'admin' || r.author?._id === user._id) && (
                      <button onClick={() => handleDeleteReply(r._id)} aria-label="Delete reply"
                        className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-surface2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </span>
                </div>
                <p className="mt-1 text-foreground/85 leading-relaxed whitespace-pre-wrap">{r.content}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-6">
        {thread.locked ? (
          <div className="card text-center text-muted-foreground"><Lock className="w-4 h-4 inline mr-2" />This discussion is locked.</div>
        ) : user ? (
          <div className="card p-5">
            <label htmlFor="reply-box" className="font-semibold">Add a reply</label>
            <textarea id="reply-box" className="input mt-3" rows={4} placeholder="Share what worked for you…"
              value={replyText} onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply(); }} />
            <div className="flex items-center justify-between gap-3 mt-3">
              <span className="text-xs text-muted-foreground hidden sm:inline">Ctrl / ⌘ + Enter to post</span>
              <Button onClick={handleReply} loading={sending} disabled={!replyText.trim()} className="ml-auto"><Send className="w-4 h-4" /> Post reply</Button>
            </div>
          </div>
        ) : (
          <div className="card text-center">
            <p className="text-muted-foreground">Sign in to join this conversation.</p>
            <div className="flex gap-2 justify-center mt-4">
              <Link to="/login" className="btn btn-primary btn-sm">Sign in</Link>
              <Link to="/register" className="btn btn-secondary btn-sm">Create account</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── New Thread Modal ───────────────────────────────────────────────────────
function NewThreadModal({ onClose, onCreated, defaultCategory }: { onClose: () => void; onCreated: () => void; defaultCategory?: string }) {
  const [form, setForm] = useState({ title: '', content: '', category: defaultCategory || CATEGORIES[0] });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const handleSave = async () => {
    if (form.title.trim().length < 5) { toast.error('Title must be at least 5 characters'); return; }
    if (!form.content.trim()) { toast.error('Add some details to your post'); return; }
    setSaving(true);
    try {
      await apiService.createThread(form);
      toast.success('Discussion started!');
      onCreated(); onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not start the discussion');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="new-thread-title"
        className="w-full max-w-lg bg-surface border border-border rounded-3xl shadow-lift animate-scale-in max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 id="new-thread-title" className="text-xl" style={{ fontStretch: '108%' }}>Start a discussion</h2>
          <button onClick={onClose} aria-label="Close" className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-surface2"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="nt-title" className="block text-sm font-semibold mb-1.5">Title</label>
            <input id="nt-title" className="input" placeholder="What's your question or topic?" value={form.title} onChange={(e) => set('title', e.target.value)} autoFocus />
          </div>
          <div>
            <label htmlFor="nt-room" className="block text-sm font-semibold mb-1.5">Room</label>
            <div className="relative">
              <select id="nt-room" className="input pr-10" value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div>
            <label htmlFor="nt-body" className="block text-sm font-semibold mb-1.5">Details</label>
            <textarea id="nt-body" className="input" rows={5} placeholder="Share your question, experience or tip…" value={form.content} onChange={(e) => set('content', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <Button onClick={handleSave} loading={saving} className="flex-1">Post discussion</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ── Thread row ─────────────────────────────────────────────────────────────
function ThreadCard({ thread }: { thread: any }) {
  const meta = metaOf(thread.category);
  const Icon = meta.icon;
  return (
    <Link to={`/community/thread/${thread._id}`} className="card p-5 flex gap-4 group animate-slide-up">
      <span className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', meta.tone)}><Icon className="w-5 h-5" /></span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          <span className="font-semibold text-foreground/80">{thread.category}</span>
          {thread.pinned && <span className="badge badge-warning py-0.5"><Pin className="w-3 h-3" />Pinned</span>}
          {thread.locked && <span className="badge badge-danger py-0.5"><Lock className="w-3 h-3" />Locked</span>}
          <span>· {formatRelativeTime(thread.lastActivityAt || thread.createdAt)}</span>
        </div>
        <h3 className="mt-1.5 text-[1.1rem] leading-snug group-hover:text-primary transition-colors">{thread.title}</h3>
        {thread.content && <p className="mt-1.5 text-[15px] text-foreground/70 line-clamp-2">{thread.content}</p>}
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-2"><Avatar name={thread.author?.name} size="w-6 h-6 text-[11px]" />{thread.author?.name || 'Runner'}</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" />{thread.replyCount ?? 0}</span>
          {thread.likeCount > 0 && <span className="flex items-center gap-1"><Heart className="w-4 h-4" />{thread.likeCount}</span>}
          {thread.views > 0 && <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{thread.views}</span>}
        </div>
      </div>
    </Link>
  );
}

// ── Main Community Page ────────────────────────────────────────────────────
export function CommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { threadId: activeThreadId } = useParams<{ threadId: string }>();
  const [allThreads, setAllThreads] = useState<any[]>([]);
  const [pubStats, setPubStats] = useState<{ totalUsers: number; totalThreads: number; totalPosts: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<string>('all');
  const [showNewThread, setShowNewThread] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const res = await apiService.getThreads(1, 200);
      setAllThreads(res.items || []);
    } catch {
      toast.error('Could not load discussions');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    apiService.getPublicStats().then((s) => setPubStats({ totalUsers: s.totalUsers, totalThreads: s.totalThreads, totalPosts: s.totalPosts })).catch(() => {});
    fetchThreads();
  }, []);

  const handleNewThread = useCallback((t: any) => setAllThreads((prev) => (prev.some((x) => x._id === t._id) ? prev : [t, ...prev])), []);
  const handleThreadActivity = useCallback((u: { _id: string; replyCount: number; lastActivityAt: string }) => {
    setAllThreads((prev) => prev.map((t) => (t._id === u._id ? { ...t, replyCount: u.replyCount, lastActivityAt: u.lastActivityAt } : t)));
  }, []);
  const handleThreadRemoved = useCallback(({ _id }: { _id: string }) => setAllThreads((prev) => prev.filter((t) => t._id !== _id)), []);

  useSocketRoom('community', 'join-community', 'leave-community', 'community', {
    'new-thread': handleNewThread,
    'thread-activity': handleThreadActivity,
    'thread-removed': handleThreadRemoved,
  });

  useSeo({
    title: 'Running Community & Forum',
    description: 'Ask questions, share training tips, talk races and gear, and keep each other motivated in the CoolRunningsFitness running forum.',
    disabled: Boolean(activeThreadId), // the open thread sets its own tags
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    allThreads.forEach((t) => { c[t.category] = (c[t.category] || 0) + 1; });
    return c;
  }, [allThreads]);

  const visible = allThreads
    .filter((t) => room === 'all' || t.category === room)
    .filter((t) => !mineOnly || t.author?._id === user?._id)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.lastActivityAt || b.createdAt).getTime() - new Date(a.lastActivityAt || a.createdAt).getTime();
    });

  if (activeThreadId) {
    return (
      <div className="container-custom max-w-3xl py-8 md:py-12">
        <ThreadView threadId={activeThreadId} onBack={() => navigate('/community')} />
      </div>
    );
  }

  const rooms = [{ id: 'all', name: 'All discussions', Icon: LayoutGrid, count: allThreads.length }, ...CATEGORIES.map((c) => ({ id: c, name: c, Icon: metaOf(c).icon, count: counts[c] || 0 }))];
  const startButton = user
    ? <Button onClick={() => setShowNewThread(true)}><Plus className="w-4 h-4" /> Start a discussion</Button>
    : <Link to="/login" className="btn btn-primary">Sign in to post</Link>;

  return (
    <div>
      {showNewThread && <NewThreadModal onClose={() => setShowNewThread(false)} onCreated={fetchThreads} defaultCategory={room !== 'all' ? room : undefined} />}

      <section className="bg-surface border-b border-border">
        <div className="container-custom pt-12 md:pt-16 pb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <span className="eyebrow-pill mb-5"><span className="w-2 h-2 rounded-full bg-primary" />Community forum</span>
            <h1>Ask, share, run together.</h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground">Questions about training, races, gear or recovery: real answers from runners who've been there.</p>
            <div className="mt-7">{startButton}</div>
          </div>
          {pubStats && (
            <dl className="flex gap-8 lg:gap-10">
              {[['Members', pubStats.totalUsers], ['Discussions', pubStats.totalThreads], ['Replies', pubStats.totalPosts]].map(([l, v]) => (
                <div key={l as string}><dt className="text-sm text-muted-foreground">{l}</dt><dd className="stat-num text-3xl mt-1">{v as number}</dd></div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <div className="container-custom py-8 md:py-12 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 lg:gap-8">
        {/* Rooms */}
        <aside className="min-w-0">
          <h2 className="sr-only">Rooms</h2>
          <div className="flex lg:flex-col gap-2 lg:gap-1 overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 lg:sticky lg:top-24">
            {rooms.map(({ id, name, Icon, count }) => (
              <button key={id} type="button" onClick={() => setRoom(id)} aria-pressed={room === id}
                className={cn('shrink-0 flex items-center gap-3 h-11 px-4 lg:px-3 rounded-full lg:rounded-xl text-[15px] transition-colors border lg:border-0',
                  room === id ? 'bg-ink text-[rgb(var(--ink-foreground))] border-transparent lg:bg-surface2 lg:text-foreground font-bold' : 'bg-surface border-border text-foreground/80 hover:bg-surface2 lg:bg-transparent font-medium')}>
                <Icon className="w-[18px] h-[18px] hidden lg:block" />
                <span className="whitespace-nowrap">{name}</span>
                <span className={cn('text-xs ml-auto tabular-nums', room === id ? 'opacity-80' : 'text-muted-foreground')}>{count}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Threads */}
        <section aria-labelledby="threads-title" className="min-w-0">
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <h2 id="threads-title" className="text-2xl" style={{ fontStretch: '110%' }}>{room === 'all' ? 'Latest activity' : room}</h2>
            {user && (
              <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer select-none">
                <span className={cn('toggle', mineOnly && 'on')}><span className="toggle-thumb" /></span>
                <input type="checkbox" className="sr-only" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
                My discussions
              </label>
            )}
          </div>
          {loading ? (
            <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>
          ) : visible.length === 0 ? (
            <div className="card"><EmptyState icon={<MessageSquare className="w-6 h-6" />} title={mineOnly ? "You haven't started a discussion yet" : 'No discussions here yet'}>
              {user ? <button onClick={() => setShowNewThread(true)} className="text-primary font-semibold hover:underline">Start the first one</button> : <Link to="/register" className="text-primary font-semibold hover:underline">Join to start one</Link>}
            </EmptyState></div>
          ) : (
            <div className="space-y-3">{visible.map((t) => <ThreadCard key={t._id} thread={t} />)}</div>
          )}
        </section>
      </div>
    </div>
  );
}
