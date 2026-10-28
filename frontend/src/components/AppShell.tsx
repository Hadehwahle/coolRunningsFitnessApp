import { ReactNode, useCallback, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Newspaper, Settings, Shield, FileText, LogOut, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils';
import { Logo, ThemeSegmented, ThemeToggle } from './Brand';
import { HamburgerButton, MobileMenu } from './MobileMenu';
import { NotificationBell } from './NotificationBell';
import { SearchBar } from './SearchBar';
import { ScrollToTop } from './ScrollToTop';

type Item = { name: string; href: string; Icon: typeof Home; exact?: boolean };

/** Sidebar layout for signed-in pages (dashboard, settings, admin). */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAdmin, logout } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const main: Item[] = [
    ...(isAdmin ? [] : [{ name: 'Dashboard', href: '/dashboard', Icon: LayoutDashboard }]),
    { name: 'Community', href: '/community', Icon: MessageSquare },
    { name: 'Blog', href: '/blog', Icon: Newspaper },
    { name: 'Settings', href: '/settings', Icon: Settings },
  ];
  const admin: Item[] = isAdmin ? [
    { name: 'Overview', href: '/admin', Icon: Shield, exact: true },
    { name: 'Blog posts', href: '/admin/blog', Icon: FileText },
  ] : [];

  const isActive = (i: Item) => (i.exact ? pathname === i.href : pathname.startsWith(i.href));

  const link = (i: Item) => (
    <Link key={i.href} to={i.href} aria-current={isActive(i) ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 h-11 px-3 rounded-xl text-[15px] transition-colors',
        isActive(i) ? 'bg-surface2 text-foreground font-bold' : 'text-muted-foreground font-medium hover:text-foreground hover:bg-surface2'
      )}>
      <i.Icon className="w-[18px] h-[18px]" /> {i.name}
    </Link>
  );

  // Phone menu: same destinations, plus Home
  const mobileItems = [
    ...admin.map((i) => ({ name: i.name === 'Overview' ? 'Admin' : i.name, href: i.href })),
    ...main.map((i) => ({ name: i.name, href: i.href })),
    { name: 'Home', href: '/' },
  ];

  return (
    <div className="min-h-screen bg-background lg:flex">
      <ScrollToTop />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[248px] shrink-0 sticky top-0 h-screen bg-surface border-r border-border px-4 py-5">
        <div className="px-1 pb-6"><Logo small /></div>
        <nav aria-label="App" className="flex flex-col gap-0.5">
          {main.map(link)}
          {admin.length > 0 && (
            <>
              <p className="px-3 pt-5 pb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Admin</p>
              {admin.map(link)}
            </>
          )}
        </nav>
        <div className="mt-auto pt-4 space-y-3">
          <ThemeSegmented />
          {user && (
            <div className="flex items-center gap-3 p-2 rounded-2xl border border-border">
              <span className="w-10 h-10 rounded-full bg-ink text-[rgb(var(--ink-foreground))] flex items-center justify-center font-bold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <button type="button" onClick={() => logout()} aria-label="Sign out"
                className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-surface2 shrink-0">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar: full on phones, tools only on desktop */}
        <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border lg:bg-background/80 lg:border-transparent">
          <div className="h-16 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-2">
            <div className="lg:hidden"><Logo compact /></div>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-1">
              <div className="hidden md:block"><SearchBar /></div>
              <div className="md:hidden"><SearchBar variant="icon" /></div>
              <ThemeToggle className="hidden sm:flex lg:flex" />
              <NotificationBell />
              <div className="lg:hidden">
                <HamburgerButton open={menuOpen} onClick={() => setMenuOpen((o) => !o)} controls="app-menu" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-10 pt-4 pb-14">{children}</main>
      </div>

      <MobileMenu id="app-menu" open={menuOpen} onClose={closeMenu} items={mobileItems} />
    </div>
  );
}
