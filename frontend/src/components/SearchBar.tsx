import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Search, X, FileText, MessageSquare, Clock } from 'lucide-react';
import { apiService, assetUrl } from '@/services/api';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function SearchBar({ variant = 'button', onOpen }: { variant?: 'button' | 'field' | 'icon'; onOpen?: () => void } = {}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ posts: any[]; threads: any[] }>({ posts: [], threads: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 280);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults({ posts: [], threads: [] }); return; }
    setLoading(true);
    apiService.search(debouncedQuery)
      .then(setResults)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  // Open on keyboard shortcut Cmd/Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const close = () => { setOpen(false); setQuery(''); setResults({ posts: [], threads: [] }); };

  const goTo = (path: string) => { navigate(path); close(); };

  const hasResults = results.posts.length > 0 || results.threads.length > 0;
  const showDropdown = open && (loading || hasResults || (query.length >= 2 && !loading));

  return (
    <>
      {/* Trigger button */}
      {variant === 'icon' ? (
        <button
          onClick={() => { onOpen?.(); setOpen(true); }}
          className="w-11 h-11 rounded-full flex items-center justify-center text-foreground hover:bg-surface2 transition-colors"
          aria-label="Search"
        >
          <Search className="w-[18px] h-[18px]" />
        </button>
      ) : (
        <button
          onClick={() => { onOpen?.(); setOpen(true); }}
          className={variant === 'field'
            ? 'w-full flex items-center gap-3 px-4 h-12 rounded-2xl bg-surface2 text-muted-foreground text-[15px] hover:text-foreground transition-colors'
            : 'flex items-center gap-2 pl-3 pr-2 h-10 rounded-full bg-surface border border-border hover:border-foreground/25 transition-colors text-muted-foreground hover:text-foreground text-sm'}
          aria-label="Search posts and discussions"
          title="Search (⌘K)"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className={variant === 'field' ? '' : 'hidden xl:inline'}>Search posts & discussions…</span>
          {variant !== 'field' && (
            <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] bg-surface2 text-muted-foreground font-mono">⌘K</kbd>
          )}
        </button>
      )}

      {/* Overlay + modal (portal, so it isn't clipped by a sliding menu) */}
      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={close}
          />

          {/* Modal */}
          <div
            ref={containerRef}
            className="relative w-full max-w-xl rounded-3xl shadow-lift border border-border overflow-hidden animate-scale-in bg-surface"
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search posts, discussions, categories…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 rounded hover:bg-surface2 text-muted-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="px-2 py-1 rounded bg-surface2 text-xs text-muted-foreground font-mono border border-border">
                ESC
              </kbd>
            </div>

            {/* Results */}
            {showDropdown && (
              <div className="max-h-[60vh] overflow-y-auto">
                {loading && (
                  <div className="flex items-center justify-center py-10">
                    <div className="spinner w-6 h-6" style={{ width: 24, height: 24 }} />
                  </div>
                )}

                {!loading && query.length >= 2 && !hasResults && (
                  <div className="py-10 text-center text-muted-foreground text-sm">
                    No results for <strong>"{query}"</strong>
                  </div>
                )}

                {!loading && results.posts.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b border-border bg-surface2">
                      Blog Posts
                    </div>
                    {results.posts.map((post) => (
                      <button
                        key={post._id}
                        onClick={() => goTo(`/blog/${post.slug}`)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-surface2 transition-colors text-left border-b border-border/50 last:border-0"
                      >
                        {post.featuredImage ? (
                          <img src={assetUrl(post.featuredImage)} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{post.title}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{post.excerpt}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="text-primary font-medium">{post.category}</span>
                            <span>·</span>
                            <Clock className="w-3 h-3" />
                            <span>{post.readTime} min</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!loading && results.threads.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b border-border bg-surface2">
                      Community Discussions
                    </div>
                    {results.threads.map((thread) => (
                      <button
                        key={thread._id}
                        onClick={() => goTo(`/community/thread/${thread._id}`)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-surface2 transition-colors text-left border-b border-border/50 last:border-0"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-4 h-4 text-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{thread.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="text-primary font-medium">{thread.category}</span>
                            <span>·</span>
                            <span>by {thread.author?.name}</span>
                            <span>·</span>
                            <span>{thread.views} views</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick links when no query */}
                {!query && (
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-semibold">Quick Links</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Blog', path: '/blog' },
                        { label: 'Community', path: '/community' },
                        { label: 'About', path: '/about' },
                        { label: 'Contact', path: '/contact' },
                      ].map(({ label, path }) => (
                        <button
                          key={path}
                          onClick={() => goTo(path)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface2 hover:bg-surface3 border border-border transition-colors text-sm text-left text-foreground/70 hover:text-foreground"
                        >
                          <Search className="w-3.5 h-3.5 text-muted-foreground" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer hint */}
            <div className="px-4 py-2 bg-surface2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Type to search blog posts and discussions</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-border font-mono">↵</kbd> to navigate
              </span>
            </div>
          </div>
        </div>
      , document.body)}
    </>
  );
}
