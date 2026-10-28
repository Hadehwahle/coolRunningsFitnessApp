import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { Cover, Skeleton } from '@/components/ui';
import { Clock, Calendar, ArrowLeft, AlertCircle, RefreshCw, Link2, Check } from 'lucide-react';
import { formatDate } from '@/utils';
import { apiService, assetUrl } from '@/services/api';
import { useSeo, SITE_URL } from '@/hooks/useSeo';
import type { BlogPost } from '@/types';

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<(BlogPost & { related?: BlogPost[]; publishedAt?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getBlogPost(slug);
      setPost(data);
    } catch (err: any) {
      setError(err?.response?.status === 404 ? 'not_found' : 'server_error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPost(); window.scrollTo(0, 0); }, [slug]);

  // Title, description, social preview and Article structured data for this post
  const published = post?.publishedAt || post?.createdAt;
  useSeo({
    title: post?.title || 'Article',
    description: post?.excerpt,
    image: post?.featuredImage ? assetUrl(post.featuredImage) : undefined,
    type: 'article',
    noindex: post ? !post.published : false,
    publishedTime: published,
    modifiedTime: post?.updatedAt,
    jsonLd: post ? {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      image: post.featuredImage ? [assetUrl(post.featuredImage).startsWith('http') ? assetUrl(post.featuredImage) : `${SITE_URL}${assetUrl(post.featuredImage)}`] : undefined,
      datePublished: published,
      dateModified: post.updatedAt,
      author: { '@type': 'Person', name: post.author?.name || 'CoolRunningsFitness' },
      publisher: { '@type': 'Organization', name: 'CoolRunningsFitness', logo: { '@type': 'ImageObject', url: `${SITE_URL}/apple-touch-icon.png` } },
      mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
      articleSection: post.category,
      keywords: post.tags?.join(', '),
    } : null,
  });

  // Reading progress + share
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById('article-body');
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      setProgress(Math.min(1, Math.max(0, -r.top / (total || 1))));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [post]);

  if (loading) {
    return (
      <div className="container-custom max-w-3xl py-14 space-y-5" aria-busy="true">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-80 w-full mt-8" />
      </div>
    );
  }

  if (error === 'not_found' || (!post && error !== 'server_error')) {
    return (
      <div className="container-custom max-w-xl py-24 text-center">
        <p className="section-tag justify-center">404</p>
        <h1 className="text-4xl mt-3">Article not found</h1>
        <p className="text-muted-foreground mt-3">This post may have been removed, or the link may be wrong.</p>
        <Link to="/blog" className="btn btn-primary mt-8"><ArrowLeft className="w-4 h-4" /> Back to the blog</Link>
      </div>
    );
  }

  if (error === 'server_error' || !post) {
    return (
      <div className="container-custom max-w-md py-24 text-center">
        <AlertCircle className="w-8 h-8 text-danger mx-auto" />
        <h1 className="text-2xl mt-4">Couldn't load this article</h1>
        <p className="text-muted-foreground mt-2">Check your connection and try again.</p>
        <div className="flex gap-3 justify-center mt-6">
          <button onClick={fetchPost} className="btn btn-primary"><RefreshCw className="w-4 h-4" /> Retry</button>
          <Link to="/blog" className="btn btn-secondary">Back to the blog</Link>
        </div>
      </div>
    );
  }

  const authorName = post.author?.name ?? 'CoolRunnings Team';
  const authorBio = (post.author as any)?.bio as string | undefined;
  const shareUrl = `${SITE_URL}/blog/${post.slug}`;
  const share = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${post.title} ${shareUrl}`)}` },
    { label: 'X', href: `https://x.com/intent/post?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
  ];
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  return (
    <div>
      {/* Reading progress */}
      <div className="fixed top-16 inset-x-0 h-[3px] z-40 pointer-events-none" aria-hidden="true">
        <div className="h-full bg-primary origin-left" style={{ transform: `scaleX(${progress})` }} />
      </div>

      {!post.published && (
        <div className="bg-warning/15 border-b border-warning/30 text-warning text-sm text-center py-2.5 px-4 font-semibold">
          Draft preview: only admins can see this post until it's published.
        </div>
      )}

      {/* Header */}
      <header className="bg-surface border-b border-border">
        <div className="container-custom max-w-3xl pt-8 md:pt-12 pb-10">
          <Link to="/blog" className="flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 -ml-1 px-1 py-2">
            <ArrowLeft className="w-4 h-4" /> All articles
          </Link>
          <Link to={`/blog?category=${encodeURIComponent(post.category)}`} className="section-tag hover:underline">{post.category}</Link>
          <h1 className="mt-4 text-[2.25rem] sm:text-5xl md:text-[3.4rem] leading-[1.02]">{post.title}</h1>
          <p className="mt-5 text-lg md:text-xl text-foreground/75">{post.excerpt}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2.5 text-foreground font-semibold">
              <span className="w-9 h-9 rounded-full bg-ink text-[rgb(var(--ink-foreground))] flex items-center justify-center text-sm">{authorName.charAt(0)}</span>
              {authorName}
            </span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatDate((post as any).publishedAt || post.createdAt)}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{post.readTime} min read</span>
          </div>
        </div>
      </header>

      {post.featuredImage && (
        <div className="container-custom max-w-5xl mt-8 md:mt-10">
          <div className="aspect-[16/9] rounded-3xl overflow-hidden border border-border">
            <Cover src={post.featuredImage} alt={post.title} />
          </div>
        </div>
      )}

      <article id="article-body" className="container-custom max-w-3xl py-10 md:py-14">
        <div className="blog-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />

        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2" aria-label="Tags">
            {post.tags.map((tag) => <span key={tag} className="badge badge-default">#{tag}</span>)}
          </div>
        )}

        {/* Share */}
        <div className="mt-10 pt-8 border-t border-border flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold mr-2">Share</span>
          <button type="button" onClick={copyLink} className="btn btn-secondary btn-sm">
            {copied ? <Check className="w-4 h-4 text-success" /> : <Link2 className="w-4 h-4" />} {copied ? 'Copied' : 'Copy link'}
          </button>
          {share.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">{s.label}</a>
          ))}
        </div>

        {/* Author */}
        <div className="mt-8 card flex items-start gap-4">
          <span className="w-12 h-12 rounded-full bg-ink text-[rgb(var(--ink-foreground))] flex items-center justify-center text-lg font-bold shrink-0">{authorName.charAt(0)}</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Written by</p>
            <p className="font-bold text-lg mt-0.5">{authorName}</p>
            {authorBio && <p className="text-muted-foreground mt-1">{authorBio}</p>}
          </div>
        </div>

        {/* Discuss */}
        <div className="mt-8 rounded-[24px] bg-ink text-[rgb(var(--ink-foreground))] p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <p className="font-bold text-xl" style={{ fontStretch: '110%' }}>Got a question about this?</p>
            <p className="opacity-75 mt-1">Ask runners who've been there in the community forum.</p>
          </div>
          <Link to="/community" className="btn bg-[rgb(var(--ink-foreground))] text-[rgb(var(--ink))] hover:opacity-90 shrink-0">Open the forum</Link>
        </div>
      </article>

      {/* Related */}
      {post.related && post.related.length > 0 && (
        <section className="border-t border-border bg-surface">
          <div className="container-custom py-14">
            <h2 className="text-3xl mb-8">Keep reading</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {post.related.map((r) => (
                <Link key={r._id} to={`/blog/${r.slug}`} className="card p-0 overflow-hidden group">
                  <div className="aspect-[16/10] overflow-hidden"><Cover src={r.featuredImage} alt={r.title} className="group-hover:scale-[1.03] transition-transform duration-500" /></div>
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">{r.category} · {r.readTime} min</p>
                    <p className="mt-2 text-lg font-bold leading-snug group-hover:text-primary transition-colors">{r.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
