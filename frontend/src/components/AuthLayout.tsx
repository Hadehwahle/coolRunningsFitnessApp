import { ReactNode } from 'react';
import { Logo, ThemeToggle } from './Brand';

/**
 * Shared frame for sign in, sign up and the password pages:
 * a brand panel on large screens and a focused form column.
 */
export function AuthLayout({ eyebrow, title, intro, children, footer }: {
  eyebrow?: string; title: ReactNode; intro?: ReactNode; children: ReactNode; footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Brand panel */}
      <aside className="on-ink hidden lg:flex flex-col justify-between bg-ink text-[rgb(var(--ink-foreground))] p-12 xl:p-16 relative overflow-hidden">
        <svg viewBox="0 0 600 600" className="absolute -right-24 -bottom-24 w-[620px]" aria-hidden="true">
          <path d="M20 520 C 120 500, 140 360, 250 352 S 380 440, 430 330 S 520 120, 600 140" fill="none" stroke="currentColor" strokeOpacity="0.07" strokeWidth="40" strokeLinecap="round" />
          <path d="M20 520 C 120 500, 140 360, 250 352 S 380 440, 430 330 S 520 120, 600 140" fill="none" stroke="rgb(var(--logo-orange))" strokeOpacity="0.85" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 14" />
        </svg>
        <div className="relative on-ink [&_a]:text-[rgb(var(--ink-foreground))]"><Logo /></div>
        <div className="relative max-w-md">
          <p className="font-extrabold leading-[0.95] text-[3.75rem] xl:text-[4.5rem]" style={{ fontStretch: '125%', letterSpacing: '-0.035em' }}>
            Every km<br />counts.
          </p>
          <p className="mt-6 text-lg opacity-75">Log your runs, watch your progress add up, and keep going with runners who've been where you're heading.</p>
        </div>
        <ul className="relative grid grid-cols-3 gap-6 text-sm opacity-80 max-w-md">
          <li><span className="block font-bold text-base opacity-100">Log</span>every run in seconds</li>
          <li><span className="block font-bold text-base opacity-100">Track</span>weekly goals & bests</li>
          <li><span className="block font-bold text-base opacity-100">Ask</span>a friendly forum</li>
        </ul>
      </aside>

      {/* Form column */}
      <main className="min-h-screen lg:min-h-0 flex flex-col">
        <div className="flex items-center justify-between px-5 sm:px-8 h-16">
          <div className="lg:invisible"><Logo small /></div>
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8">
          <div className="w-full max-w-[420px] animate-slide-up">
            {eyebrow && <p className="section-tag mb-3">{eyebrow}</p>}
            <h1 className="text-[2.25rem] sm:text-[2.6rem] leading-[1.02]">{title}</h1>
            {intro && <p className="mt-3 text-muted-foreground">{intro}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 pt-6 border-t border-border text-center text-[15px] text-muted-foreground">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="mb-5 flex items-start gap-3 px-4 py-3 rounded-2xl border border-danger/30 bg-danger/10 text-danger text-sm animate-scale-in">
      <svg viewBox="0 0 24 24" className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.5" /></svg>
      <div>{children}</div>
    </div>
  );
}
