import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Settings, ChevronDown, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils';
import { SearchBar } from './SearchBar';
import { NotificationBell } from './NotificationBell';
import { Logo, ThemeToggle } from './Brand';
import { HamburgerButton, MobileMenu, NavItem } from './MobileMenu';

export const PUBLIC_NAV: NavItem[] = [
  { name: 'Home', href: '/' },
  { name: 'Blog', href: '/blog' },
  { name: 'Community', href: '/community' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export function UserMenu() {
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('[data-user-menu]')) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  if (!user) return null;
  const item = 'flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium hover:bg-surface2 transition-colors';

  return (
    <div className="relative" data-user-menu>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 h-11 pl-1 pr-3 rounded-full border border-border bg-surface hover:bg-surface2 transition-colors max-w-[200px]"
      >
        <span className="w-9 h-9 rounded-full bg-ink text-[rgb(var(--ink-foreground))] flex items-center justify-center text-sm font-bold shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="text-sm font-semibold truncate">{user.name.split(' ')[0]}</span>
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-60 rounded-2xl border border-border bg-surface p-1.5 shadow-lift animate-slide-down z-50">
          <div className="px-3 py-2.5 border-b border-border mb-1">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <Link role="menuitem" to="/dashboard" className={item}><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
          <Link role="menuitem" to="/settings" className={item}><Settings className="w-4 h-4" /> Settings</Link>
          {isAdmin && <Link role="menuitem" to="/admin" className={item}><Shield className="w-4 h-4" /> Admin</Link>}
          <button role="menuitem" type="button" onClick={() => logout()} className={cn(item, 'w-full text-danger')}>
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className={cn(
      'sticky top-0 z-50 border-b transition-colors duration-200',
      scrolled ? 'bg-surface/90 backdrop-blur-md border-border' : 'bg-surface border-border'
    )}>
      <nav aria-label="Main" className="container-custom h-16 flex items-center justify-between gap-3">
        <Logo />

        {/* Desktop links */}
        <ul className="hidden lg:flex items-center gap-1">
          {PUBLIC_NAV.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={cn(
                  'relative px-3.5 py-2 rounded-full text-[15px] transition-colors',
                  isActive(item.href) ? 'text-foreground font-bold' : 'text-muted-foreground font-medium hover:text-foreground'
                )}
              >
                {item.name}
                {isActive(item.href) && <span className="absolute left-1/2 -translate-x-1/2 -bottom-[13px] h-[3px] w-6 rounded-full bg-primary" />}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1">
          <div className="hidden md:block"><SearchBar /></div>
          <div className="md:hidden"><SearchBar variant="icon" /></div>
          <ThemeToggle className="hidden sm:flex" />
          <NotificationBell />
          {user ? (
            <div className="hidden lg:block ml-1"><UserMenu /></div>
          ) : (
            <div className="hidden lg:flex items-center gap-1 ml-1">
              <Link to="/login" className="btn btn-ghost btn-sm text-foreground">Sign in</Link>
              <Link to="/register" className="btn btn-ink btn-sm">Join free</Link>
            </div>
          )}
          <div className="lg:hidden">
            <HamburgerButton open={menuOpen} onClick={() => setMenuOpen((o) => !o)} controls="site-menu" />
          </div>
        </div>
      </nav>

      <MobileMenu id="site-menu" open={menuOpen} onClose={closeMenu} items={PUBLIC_NAV} />
    </header>
  );
}
