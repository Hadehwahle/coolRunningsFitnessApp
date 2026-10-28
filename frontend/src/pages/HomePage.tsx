import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LineChart, Trophy, MessageCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import { useSeo } from '@/hooks/useSeo';
import { FAQSection } from '@/components/FAQSection';
import { Cover, SectionHeading, Skeleton } from '@/components/ui';
import type { BlogPost } from '@/types';

// Example splits shown in the hero card (clearly labelled as an example)
const EXAMPLE_SPLITS = [
  { km: 1, pace: '5:28', pct: 62 },
  { km: 2, pace: '5:14', pct: 74 },
  { km: 3, pace: '5:02', pct: 86, fast: true },
  { km: 4, pace: '4:58', pct: 90, fast: true },
  { km: 5, pace: '5:04', pct: 84, fast: true },
];

const FEATURES = [
  { Icon: LineChart, title: 'Log every run', text: 'Distance, time, pace, weather and how it felt, in under a minute. Your whole history, searchable.' },
  { Icon: Trophy, title: 'Chase your bests', text: 'Weekly totals, longest runs, fastest paces and streaks, worked out for you as you go.' },
  { Icon: MessageCircle, title: 'Ask the community', text: "Training, gear, races and recovery: real answers from runners who've been there." },
];

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

export function HomePage() {
  useSeo({ description: 'Track your runs, see your progress, and join a community of runners. Free running log, training tips, race guides and a friendly forum. We run together.' });
  const { user } = useAuth();
  const [stats, setStats] = useState<{ totalUsers: number; totalRuns: number; totalThreads: number; totalBlogPosts: number } | null>(null);
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [threads, setThreads] = useState<any[] | null>(null);

  useEffect(() => {
    apiService.getPublicStats().then(setStats).catch(() => {});
    apiService.getBlogPosts(1, 5).then((r) => setPosts(r.items || [])).catch(() => setPosts([]));
    apiService.getThreads(1, 3).then((r) => setThreads(r.items || [])).catch(() => setThreads([]));
  }, []);

  const [lead, ...rest] = posts || [];
  const primaryCta = user ? { to: user.role === 'admin' ? '/admin' : '/dashboard', label: 'Go to your dashboard' } : { to: '/register', label: 'Start tracking free' };

  return (
    <div>
      {/* ── Hero ── */}
      <section className="container-custom pt-12 pb-16 md:pt-20 md:pb-24 grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-12 lg:gap-16 items-center">
        <div className="animate-slide-up">
          <span className="eyebrow-pill mb-6"><span className="w-2 h-2 rounded-full bg-primary" />Free run log for every level</span>
          <h1 className="font-wide text-[3.25rem] leading-[0.95] sm:text-7xl lg:text-[5.5rem]" style={{ letterSpacing: '-0.035em' }}>
            We run<br />together.
          </h1>
          <p className="mt-6 max-w-lg text-lg md:text-xl text-foreground/75">
            Every kilometre logged, every run counted, every personal best celebrated. Plus a community that's been where you're heading.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to={primaryCta.to} className="btn btn-primary btn-lg">{primaryCta.label} <ArrowRight className="w-4 h-4" /></Link>
            <Link to="/blog" className="btn btn-secondary btn-lg">Read the blog</Link>
          </div>
          {stats && (
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
              {[
                ['Runners', stats.totalUsers],
                ['Runs logged', stats.totalRuns],
                ['Discussions', stats.totalThreads],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="stat-num text-3xl mt-1">{compact(value as number)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Example split card */}
        <div className="animate-scale-in [animation-delay:120ms]">
          <div className="card p-6 sm:p-7 shadow-lift">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Wednesday tempo</p>
                <p className="stat-num text-[2.75rem] mt-2">8.00 <span className="text-lg font-medium text-muted-foreground">km</span></p>
              </div>
              <div className="text-right">
                <span className="badge badge-default">Example</span>
                <p className="text-sm text-muted-foreground mt-3">Time</p>
                <p className="text-xl font-bold">41:20</p>
              </div>
            </div>
            <ol className="mt-6 border-t border-border" aria-label="Kilometre splits">
              {EXAMPLE_SPLITS.map((s) => (
                <li key={s.km} className="grid grid-cols-[3rem_1fr_3.5rem] items-center gap-4 py-3 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">km {s.km}</span>
                  <span className="h-2.5 rounded-full bg-surface3 overflow-hidden" aria-hidden="true">
                    <span className={`block h-full rounded-full ${s.fast ? 'bg-primary' : 'bg-foreground'}`} style={{ width: `${s.pct}%` }} />
                  </span>
                  <span className="text-right font-semibold">{s.pace}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">Negative split · fastest km 4:58</p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-surface border-y border-border">
        <div className="container-custom py-16 md:py-20 grid md:grid-cols-3 gap-10">
          {FEATURES.map(({ Icon, title, text }) => (
            <div key={title}>
              <span className="w-12 h-12 rounded-2xl bg-surface2 flex items-center justify-center"><Icon className="w-[22px] h-[22px]" /></span>
              <h3 className="mt-5 mb-2 text-[1.375rem]">{title}</h3>
              <p className="text-foreground/75">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Blog ── */}
      <section className="container-custom pt-20 md:pt-24 pb-10">
        <SectionHeading title="Training notes" link="/blog" linkLabel="All articles" />
        {posts === null ? (
          <div className="grid lg:grid-cols-[3fr_2fr] gap-6"><Skeleton className="h-[420px]" /><Skeleton className="h-[420px]" /></div>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground">New articles are on the way.</p>
        ) : (
          <div className="grid lg:grid-cols-[3fr_2fr] gap-6">
            <Link to={`/blog/${lead.slug}`} className="card p-0 overflow-hidden group">
              <div className="aspect-[2/1] overflow-hidden"><Cover src={lead.featuredImage} alt={lead.title} label={lead.category} className="group-hover:scale-[1.02] transition-transform duration-500" /></div>
              <div className="p-6 md:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">{lead.category} · {lead.readTime} min</p>
                <h3 className="mt-3 text-2xl md:text-[1.9rem] leading-tight group-hover:text-primary transition-colors">{lead.title}</h3>
                <p className="mt-3 text-foreground/75 line-clamp-2">{lead.excerpt}</p>
              </div>
            </Link>
            <div className="card py-2">
              {rest.map((p) => (
                <Link key={p._id} to={`/blog/${p.slug}`} className="block py-5 border-b border-border last:border-0 group">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">{p.category} · {p.readTime} min</p>
                  <p className="mt-2 text-lg font-semibold leading-snug group-hover:text-primary transition-colors">{p.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Community ── */}
      <section className="container-custom py-16 md:py-20">
        <SectionHeading title="Asked this week" link="/community" linkLabel="Open the forum" />
        {threads === null ? (
          <div className="grid md:grid-cols-3 gap-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44" />)}</div>
        ) : threads.length === 0 ? (
          <p className="text-muted-foreground">Be the first to <Link to="/community" className="text-primary font-semibold">start a discussion</Link>.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {threads.map((t) => (
              <Link key={t._id} to={`/community/thread/${t._id}`} className="card flex flex-col gap-4 group">
                <span className="badge badge-default self-start">{t.category}</span>
                <span className="text-lg font-bold leading-snug group-hover:text-primary transition-colors">{t.title}</span>
                <span className="mt-auto flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="w-4 h-4" /> {t.replyCount ?? 0} {t.replyCount === 1 ? 'reply' : 'replies'} · {t.author?.name || 'Runner'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── CTA ── */}
      {!user && (
        <section className="container-custom pb-20">
          <div className="rounded-[28px] bg-ink text-[rgb(var(--ink-foreground))] px-7 py-12 md:px-14 md:py-16 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="text-[2.25rem] md:text-[3.25rem] leading-none" style={{ color: 'inherit' }}>Start your log today.</h2>
              <p className="mt-4 text-lg opacity-75">Free for runners. Takes thirty seconds.</p>
            </div>
            <Link to="/register" className="btn btn-lg bg-[rgb(var(--ink-foreground))] text-[rgb(var(--ink))] hover:opacity-90 shrink-0">Create free account</Link>
          </div>
        </section>
      )}

      <FAQSection dark />
    </div>
  );
}
