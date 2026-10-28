import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { apiService, errorMessage } from '@/services/api';
import { Logo, LogoMark } from './Brand';

function FacebookIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function AppStoreIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function PlayStoreIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M3.18 23.76c.3.17.64.24.99.2l12.24-12.24L13 8.4 3.18 23.76zm17.1-10.85L17.5 11.4l-3.4 3.4 3.4 3.4 2.8-1.51c.8-.43.8-1.55-.02-1.98zM2.82.24C2.52.08 2.17.04 1.86.2L14.1 12.43l3.42-3.41L2.82.24zm.36 1.05l11.5 11.51-11.5 11.51V1.29z"/>
    </svg>
  );
}

// Coming-soon dialog for the app store buttons
function ComingSoonModal({ store, onClose }: { store: 'App Store' | 'Google Play'; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="coming-soon-title"
        className="relative w-full max-w-sm rounded-3xl border border-border bg-surface p-8 text-center animate-scale-in"
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground hover:bg-surface2">
          <X className="w-4 h-4" />
        </button>
        <LogoMark className="h-10 mx-auto mb-6" />
        <span className="badge badge-primary mb-3">Coming soon</span>
        <h3 id="coming-soon-title" className="text-xl mb-2">{store === 'App Store' ? 'iPhone app' : 'Android app'}</h3>
        <p className="text-sm text-muted-foreground mb-6">
          The CoolRunnings app is on its way to {store}. Until then, the website works great on your phone. Add it to your home screen from your browser menu.
        </p>
        <button onClick={onClose} className="btn btn-ink w-full">Got it</button>
      </div>
    </div>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      toast.success(await apiService.subscribeNewsletter(email) || 'Subscribed!');
      setEmail('');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not subscribe. Please try again.'));
    } finally {
      setSending(false);
    }
  };
  return (
    <form onSubmit={submit} className="flex gap-2 w-full max-w-md">
      <label htmlFor="footer-email" className="sr-only">Email address</label>
      <input id="footer-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com" className="input rounded-full flex-1 min-w-0" />
      <button type="submit" disabled={sending} className="btn btn-primary shrink-0" aria-label="Subscribe">
        <span className="hidden xs:inline">Subscribe</span><ArrowRight className="w-4 h-4 xs:hidden" />
      </button>
    </form>
  );
}

const COLUMNS = [
  { title: 'Explore', links: [['Home', '/'], ['Blog', '/blog'], ['Community', '/community'], ['About', '/about']] },
  { title: 'Your running', links: [['Dashboard', '/dashboard'], ['Log a run', '/dashboard'], ['Settings', '/settings'], ['Contact us', '/contact']] },
  { title: 'Legal', links: [['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Disclaimer', '/disclaimer']] },
];

export function Footer() {
  const [comingSoon, setComingSoon] = useState<'App Store' | 'Google Play' | null>(null);
  const socialLinks = [
    { Icon: FacebookIcon, href: 'https://www.facebook.com/coolrunningsfitnessapp', label: 'Facebook' },
    { Icon: XIcon, href: 'https://x.com/coolrunningsfitness', label: 'X (Twitter)' },
    { Icon: InstagramIcon, href: 'https://www.instagram.com/cool_runnings_fitness/', label: 'Instagram' },
  ];

  return (
    <>
      {comingSoon && <ComingSoonModal store={comingSoon} onClose={() => setComingSoon(null)} />}

      <footer className="bg-surface border-t border-border">
        <div className="container-custom py-14">
          {/* Newsletter band */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-border">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl">Training notes, every other week.</h2>
              <p className="text-muted-foreground mt-2">New articles, race guides and community highlights. No spam, unsubscribe anytime.</p>
            </div>
            <NewsletterForm />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-10">
            <div className="col-span-2 md:col-span-1">
              <Logo />
              <p className="text-sm text-muted-foreground mt-4 max-w-xs">We run together. Track every run, learn from runners who've been there, and keep each other going.</p>
              <div className="flex gap-1 mt-4 -ml-2">
                {socialLinks.map(({ Icon, href, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface2 transition-colors">
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground mb-4" style={{ fontStretch: '100%' }}>{col.title}</h3>
                <ul className="space-y-1">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link to={href} className="inline-block py-1.5 text-[15px] text-foreground/80 hover:text-foreground transition-colors">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-12 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} CoolRunningsFitness. All rights reserved.</p>
            <div className="flex gap-2">
              <button onClick={() => setComingSoon('App Store')}
                className="flex items-center gap-2.5 h-11 px-4 rounded-full border border-border hover:bg-surface2 transition-colors text-left">
                <AppStoreIcon />
                <span className="text-sm font-semibold">App Store</span>
              </button>
              <button onClick={() => setComingSoon('Google Play')}
                className="flex items-center gap-2.5 h-11 px-4 rounded-full border border-border hover:bg-surface2 transition-colors text-left">
                <PlayStoreIcon />
                <span className="text-sm font-semibold">Google Play</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
