import { Link } from 'react-router-dom';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme, ThemeChoice } from '@/context/ThemeContext';
import { cn } from '@/utils';

/** The CoolRunnings mark: orange and gold strides with the navy head. Navy lifts in dark mode. */
export function LogoMark({ className = 'h-7' }: { className?: string }) {
  return (
    <svg viewBox="40 45 1822 692" className={cn('w-auto shrink-0', className)} aria-hidden="true" focusable="false">
      <path fill="rgb(var(--logo-orange))" d="M45 50 L1005 50 C1040 50 1062 64 1082 84 L1505 482 C1555 512 1610 518 1655 512 C1745 500 1810 440 1857 378 C1840 520 1770 640 1660 700 C1600 728 1540 732 1480 718 C1420 704 1370 670 1300 610 L888 250 C840 205 790 180 730 165 C560 135 300 105 45 50 Z" />
      <path fill="rgb(var(--logo-gold))" d="M335 372 L880 372 C925 372 960 386 995 418 L1368 725 L1180 725 C1080 725 1010 700 950 645 L842 540 C790 488 720 445 620 425 C520 405 430 392 335 372 Z" />
      <path fill="rgb(var(--logo-navy))" d="M1095 50 L1565 50 C1655 50 1722 120 1722 212 C1722 305 1650 378 1562 378 C1490 378 1430 362 1385 318 Z" />
    </svg>
  );
}

export function Logo({ to = '/', compact = false, small = false, onClick }: { to?: string; compact?: boolean; small?: boolean; onClick?: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-2.5 text-foreground shrink-0" aria-label="CoolRunningsFitness home">
      <LogoMark className={small ? 'h-[22px]' : 'h-[26px]'} />
      <span className={cn('font-extrabold tracking-tight whitespace-nowrap', small ? 'text-[15.5px]' : 'text-[18px]', compact && 'hidden sm:inline')} style={{ fontStretch: small ? '104%' : '112%' }}>
        CoolRunnings<span className="text-primary">Fitness</span>
      </span>
    </Link>
  );
}

/** Round icon button that flips between light and dark */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      className={cn('relative w-11 h-11 rounded-full flex items-center justify-center text-foreground hover:bg-surface2 transition-colors overflow-hidden', className)}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      <Sun className={cn('w-[18px] h-[18px] absolute transition-all duration-300', dark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0')} />
      <Moon className={cn('w-[18px] h-[18px] absolute transition-all duration-300', dark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100')} />
    </button>
  );
}

/** Light / Dark / System segmented control (used in the mobile menu and settings) */
export function ThemeSegmented({ className }: { className?: string }) {
  const { choice, setChoice } = useTheme();
  const options: { id: ThemeChoice; label: string; Icon: typeof Sun }[] = [
    { id: 'light', label: 'Light', Icon: Sun },
    { id: 'dark', label: 'Dark', Icon: Moon },
    { id: 'system', label: 'Auto', Icon: Monitor },
  ];
  return (
    <div role="radiogroup" aria-label="Colour theme" className={cn('grid grid-cols-3 gap-1 p-1 rounded-full bg-surface2', className)}>
      {options.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={choice === id}
          onClick={() => setChoice(id)}
          className={cn(
            'flex items-center justify-center gap-1.5 h-10 rounded-full text-sm font-semibold transition-colors',
            choice === id ? 'bg-surface text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="w-4 h-4" /> {label}
        </button>
      ))}
    </div>
  );
}
