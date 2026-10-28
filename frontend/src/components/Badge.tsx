import { cn } from '@/utils';
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
interface BadgeProps { children: React.ReactNode; variant?: BadgeVariant; className?: string; }
export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const v: Record<BadgeVariant, string> = {
    default: 'badge-default', success: 'badge-success', warning: 'badge-warning',
    danger: 'badge-danger', info: 'badge-info', primary: 'badge-primary',
  };
  return <span className={cn('badge', v[variant], className)}>{children}</span>;
}
