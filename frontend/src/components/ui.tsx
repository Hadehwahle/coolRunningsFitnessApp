import { ReactNode, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { assetUrl } from '@/services/api';
import { cn } from '@/utils';

/** Section title with an optional "see all" link, as in the Split Time design */
export function SectionHeading({ title, link, linkLabel, eyebrow, className }: {
  title: ReactNode; link?: string; linkLabel?: string; eyebrow?: string; className?: string;
}) {
  return (
    <div className={cn('flex items-end justify-between gap-4 flex-wrap mb-8', className)}>
      <div>
        {eyebrow && <p className="section-tag mb-3">{eyebrow}</p>}
        <h2 className="text-[2rem] md:text-5xl">{title}</h2>
      </div>
      {link && (
        <Link to={link} className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary-hover">
          {linkLabel || 'See all'} <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

/** Page intro used at the top of inner pages */
export function PageHero({ eyebrow, title, intro, children }: { eyebrow?: string; title: ReactNode; intro?: ReactNode; children?: ReactNode }) {
  return (
    <section className="border-b border-border bg-surface">
      <div className="container-custom py-14 md:py-20">
        {eyebrow && <span className="eyebrow-pill mb-5"><span className="w-2 h-2 rounded-full bg-primary" />{eyebrow}</span>}
        <h1 className="max-w-4xl">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-lg md:text-xl text-muted-foreground">{intro}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

/** Blog cover: the post image, or a clean generated cover with a route line when there is none */
export function Cover({ src, alt, label, className }: { src?: string; alt: string; label?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return <img src={assetUrl(src)} alt={alt} loading="lazy" onError={() => setFailed(true)} className={cn('w-full h-full object-cover bg-surface3', className)} />;
  }
  return (
    <div className={cn('relative w-full h-full bg-surface3 overflow-hidden', className)} role="img" aria-label={alt}>
      <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <path d="M-10 190 C 60 180, 80 120, 140 118 S 220 160, 260 110 S 330 30, 410 50" fill="none" stroke="rgb(var(--foreground) / 0.08)" strokeWidth="22" strokeLinecap="round" />
        <path d="M-10 190 C 60 180, 80 120, 140 118 S 220 160, 260 110 S 330 30, 410 50" fill="none" stroke="rgb(var(--primary))" strokeWidth="4" strokeLinecap="round" />
        <circle cx="140" cy="118" r="6" fill="rgb(var(--surface))" stroke="rgb(var(--foreground))" strokeWidth="3" />
      </svg>
      {label && <span className="absolute left-4 bottom-4 badge badge-ink">{label}</span>}
    </div>
  );
}

/** Empty state with an icon, message and optional action */
export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="text-center py-14 px-6">
      <div className="w-14 h-14 rounded-2xl bg-surface2 flex items-center justify-center mx-auto mb-4 text-muted-foreground">{icon}</div>
      <p className="font-semibold text-lg">{title}</p>
      {children && <div className="mt-2 text-muted-foreground">{children}</div>}
    </div>
  );
}

/** Loading placeholder block */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-surface2', className)} />;
}

/** Frame for the legal pages: shared header plus readable, consistently styled body copy. */
export function LegalPage({ title, updated, intro, children }: { title: string; updated: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <section className="border-b border-border bg-surface">
        <div className="container-custom max-w-3xl py-12 md:py-16">
          <span className="eyebrow-pill mb-5"><span className="w-2 h-2 rounded-full bg-primary" />Legal</span>
          <h1>{title}</h1>
          <p className="mt-4 text-sm text-muted-foreground">Last updated: {updated}</p>
          {intro && <p className="mt-5 text-lg text-foreground/80">{intro}</p>}
          <nav aria-label="Legal pages" className="mt-6 flex flex-wrap gap-2 text-sm">
            {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Disclaimer', '/disclaimer']].map(([l, h]) => (
              <NavLink key={h} to={h}
                className="px-3.5 h-9 inline-flex items-center rounded-full border border-border font-semibold hover:bg-surface2 aria-[current=page]:bg-ink aria-[current=page]:text-[rgb(var(--ink-foreground))] aria-[current=page]:border-transparent">{l}</NavLink>
            ))}
          </nav>
        </div>
      </section>
      <article className="legal-content container-custom max-w-3xl py-12 md:py-16">{children}</article>
    </div>
  );
}
