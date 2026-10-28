import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, RefreshCw, ArrowRight, Newspaper } from 'lucide-react';
import { formatDate, cn } from '@/utils';
import { apiService } from '@/services/api';
import { useSocketRoom } from '@/hooks/useSocket';
import { useSeo } from '@/hooks/useSeo';
import { Cover, EmptyState, Skeleton } from '@/components/ui';
import type { BlogPost } from '@/types';

const CATEGORY_ORDER = ['Beginner Tips', 'Training Plans', 'Nutrition', 'Injury Prevention', 'Race Reviews', 'Equipment', 'Motivation', 'General'];

function PostCard({ post }: { post: BlogPost & { publishedAt?: string } }) {
  return (
    <Link to={`/blog/${post.slug}`} className="card p-0 overflow-hidden flex flex-col group">
      <div className="aspect-[16/10] overflow-hidden">
        <Cover src={post.featuredImage} alt={post.title} className="group-hover:scale-[1.03] transition-transform duration-500" />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">{post.category} · {post.readTime} min</p>
        <h3 className="mt-2.5 text-[1.2rem] leading-snug group-hover:text-primary transition-colors">{post.title}</h3>
        <p className="mt-2 text-[15px] text-foreground/70 line-clamp-2">{post.excerpt}</p>
        <p className="mt-auto pt-4 text-sm text-muted-foreground">{post.author?.name || 'CoolRunnings'} · {formatDate(post.publishedAt || post.createdAt)}</p>
      </div>
    </Link>
  );
}

export function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selected = searchParams.get('category') || 'all';
  const [posts, setPosts] = useState<(BlogPost & { publishedAt?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSeo({
    title: 'Running Blog: Training, Nutrition & Race Tips',
    description: 'Training plans, beginner tips, nutrition and hydration, injury prevention, race reviews and gear advice for runners of every level.',
  });

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getBlogPosts(1, 50);
      setPosts(res.items || []);
    } catch {
      setError("We couldn't load the articles. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchPosts(); }, []);

  // Live updates: new posts appear, edits update in place, unpublished posts disappear
  const upsert = useCallback((p: BlogPost) => {
    setPosts((prev) => (prev.some((x) => x._id === p._id) ? prev.map((x) => (x._id === p._id ? p : x)) : [p, ...prev]));
  }, []);
  const remove = useCallback(({ _id }: { _id: string }) => setPosts((prev) => prev.filter((p) => p._id !== _id)), []);
  useSocketRoom('blog', 'join-blog', 'leave-blog', 'blog', { 'new-post': upsert, 'post-updated': upsert, 'post-removed': remove });

  // Only show categories that actually have posts
  const categories = useMemo(() => {
    const present = new Set(posts.map((p) => p.category));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [posts]);

  const filtered = selected === 'all' ? posts : posts.filter((p) => p.category.toLowerCase() === selected.toLowerCase());
  const lead = selected === 'all' ? (posts.find((p) => p.featured) ?? posts[0]) : undefined;
  const grid = lead ? filtered.filter((p) => p._id !== lead._id) : filtered;

  const choose = (cat: string) => setSearchParams(cat === 'all' ? {} : { category: cat }, { replace: true });

  return (
    <div>
      {/* Header */}
      <section className="bg-surface border-b border-border">
        <div className="container-custom pt-12 md:pt-16 pb-6">
          <span className="eyebrow-pill mb-5"><span className="w-2 h-2 rounded-full bg-primary" />The CoolRunnings blog</span>
          <h1 className="max-w-3xl">Training notes</h1>
          <p className="mt-4 max-w-2xl text-lg md:text-xl text-muted-foreground">
            Plans, race guides, nutrition, injury prevention and gear, written for runners of every level.
          </p>

          {/* Category chips: scroll sideways on phones */}
          <div role="tablist" aria-label="Filter by category" className="mt-8 -mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {['all', ...categories].map((c) => {
              const active = selected.toLowerCase() === c.toLowerCase();
              return (
                <button key={c} type="button" role="tab" aria-selected={active} onClick={() => choose(c)}
                  className={cn('shrink-0 h-10 px-4 rounded-full text-sm font-semibold border transition-colors',
                    active ? 'bg-ink text-[rgb(var(--ink-foreground))] border-transparent' : 'bg-surface border-border text-foreground/80 hover:bg-surface2')}>
                  {c === 'all' ? 'All articles' : c}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="container-custom py-10 md:py-14">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-[340px]" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[360px]" />)}</div>
          </div>
        ) : error ? (
          <div className="card max-w-lg mx-auto text-center">
            <AlertCircle className="w-8 h-8 text-danger mx-auto" />
            <p className="mt-3 font-semibold">{error}</p>
            <button type="button" onClick={fetchPosts} className="btn btn-secondary mt-5"><RefreshCw className="w-4 h-4" /> Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Newspaper className="w-6 h-6" />} title="No articles here yet">
            <button type="button" onClick={() => choose('all')} className="text-primary font-semibold hover:underline">See all articles</button>
          </EmptyState>
        ) : (
          <>
            {lead && (
              <Link to={`/blog/${lead.slug}`} className="card p-0 overflow-hidden grid md:grid-cols-[1.2fr_1fr] group mb-8">
                <div className="aspect-[16/10] md:aspect-auto md:min-h-[340px] overflow-hidden">
                  <Cover src={lead.featuredImage} alt={lead.title} className="group-hover:scale-[1.02] transition-transform duration-500" />
                </div>
                <div className="p-6 md:p-10 flex flex-col justify-center">
                  <span className="badge badge-primary self-start">{lead.featured ? 'Featured' : 'Latest'}</span>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.1em] text-primary">{lead.category} · {lead.readTime} min read</p>
                  <h2 className="mt-3 text-[1.75rem] md:text-[2.25rem] leading-tight group-hover:text-primary transition-colors">{lead.title}</h2>
                  <p className="mt-3 text-foreground/75 line-clamp-3">{lead.excerpt}</p>
                  <span className="mt-6 inline-flex items-center gap-2 font-semibold">Read article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                </div>
              </Link>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {grid.map((p) => <PostCard key={p._id} post={p} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
