import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, LayoutDashboard, Settings, Shield, LogOut, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo, ThemeSegmented } from './Brand';
import { SearchBar } from './SearchBar';
import { cn } from '@/utils';

export interface NavItem { name: string; href: string }

/** Three bars that morph into an X */
export function HamburgerButton({ open, onClick, controls }: { open: boolean; onClick: () => void; controls: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      aria-controls={controls}
      className="relative w-11 h-11 rounded-full flex items-center justify-center text-foreground hover:bg-surface2 transition-colors"
    >
      <span className="relative block w-5 h-[14px]" aria-hidden="true">
        <span className={cn('absolute left-0 h-[2px] w-5 rounded-full bg-current transition-all duration-300 ease-out', open ? 'top-[6px] rotate-45' : 'top-0')} />
        <span className={cn('absolute left-0 top-[6px] h-[2px] rounded-full bg-current transition-all duration-200', open ? 'w-0 opacity-0' : 'w-3.5 opacity-100')} />
        <span className={cn('absolute left-0 h-[2px] w-5 rounded-full bg-current transition-all duration-300 ease-out', open ? 'top-[6px] -rotate-45' : 'top-[12px]')} />
      </span>
    </button>
  );
}

/**
 * Full-height slide-out menu for phones and tablets.
 * Closes on: the X, the backdrop, Esc, or navigating. Locks page scroll while open
 * and keeps keyboard focus inside the panel.
 */
export function MobileMenu({ id, open, onClose, items }: { id: string; open: boolean; onClose: () => void; items: NavItem[] }) {
  const { user, isAdmin, logout } = useAuth();
  const { pathname } = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const firstPath = useRef(pathname);

  // Close when the route changes
  useEffect(() => {
    if (pathname !== firstPath.current) onClose();
    firstPath.current = pathname;
  }, [pathname, onClose]);

  // Esc to close, focus trap, scroll lock
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => panelRef.current?.querySelector<HTMLElement>('a, button')?.focus(), 60);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const f = Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input'));
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  // Account shortcuts, skipping any already listed in the main links
  const accountLinks = (user ? [
    { name: 'Dashboard', href: '/dashboard', Icon: LayoutDashboard },
    { name: 'Settings', href: '/settings', Icon: Settings },
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', Icon: Shield }] : []),
  ] : []).filter((l) => !items.some((i) => i.href === l.href) && !(isAdmin && l.href === '/dashboard'));

  return createPortal(
    <div
      className={cn('fixed inset-0 z-[60] lg:hidden overflow-hidden transition-[visibility] duration-0', open ? 'pointer-events-auto visible' : 'pointer-events-none invisible delay-[400ms]')}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn('absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')}
      />

      {/* Panel */}
      <div
        id={id}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={cn(
          'absolute right-0 top-0 h-full w-[min(92vw,400px)] bg-background border-l border-border shadow-lift flex flex-col',
          'transition-transform duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
          <Logo small onClick={onClose} />
          <button type="button" onClick={onClose} aria-label="Close menu"
            className="w-11 h-11 rounded-full flex items-center justify-center text-foreground hover:bg-surface2 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6">
          <SearchBar variant="field" onOpen={onClose} />

          {/* Main links: large, numbered, staggered in */}
          <nav aria-label="Main" className="mt-4">
            <ul>
              {items.map((item, i) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}
                    className={cn('transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]', open ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6')}
                    style={{ transitionDelay: open ? `${80 + i * 45}ms` : '0ms' }}
                  >
                    <Link
                      to={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-4 py-3.5 border-b border-border',
                        active ? 'text-foreground' : 'text-foreground/80 hover:text-foreground'
                      )}
                    >
                      <span className={cn('text-xs font-bold w-6 tabular-nums', active ? 'text-primary' : 'text-muted-foreground')}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 text-[26px] font-extrabold tracking-tight leading-none" style={{ fontStretch: '118%' }}>
                        {item.name}
                      </span>
                      {active
                        ? <span className="w-2.5 h-2.5 rounded-full bg-primary" aria-hidden="true" />
                        : <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Account */}
          {user && (
            <div className={cn('mt-7 transition-all duration-500', open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3')}
              style={{ transitionDelay: open ? `${100 + items.length * 45}ms` : '0ms' }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-11 h-11 rounded-full bg-ink text-[rgb(var(--ink-foreground))] flex items-center justify-center font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {accountLinks.map(({ name, href, Icon }) => (
                  <Link key={href} to={href}
                    className={cn('flex items-center gap-2.5 h-12 px-4 rounded-2xl text-[15px] font-semibold transition-colors',
                      isActive(href) ? 'bg-primary-soft text-primary' : 'bg-surface border border-border hover:bg-surface2')}>
                    <Icon className="w-[18px] h-[18px]" /> {name}
                  </Link>
                ))}
                <button type="button" onClick={() => { onClose(); logout(); }}
                  className="flex items-center gap-2.5 h-12 px-4 rounded-2xl text-[15px] font-semibold bg-surface border border-border text-danger hover:bg-surface2 transition-colors">
                  <LogOut className="w-[18px] h-[18px]" /> Sign out
                </button>
              </div>
            </div>
          )}

          <div className="mt-7">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Appearance</p>
            <ThemeSegmented />
          </div>
        </div>

        {!user && (
          <div className="px-5 py-4 border-t border-border grid grid-cols-2 gap-2 shrink-0 bg-background">
            <Link to="/login" className="btn btn-secondary">Sign in</Link>
            <Link to="/register" className="btn btn-primary">Join free</Link>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
