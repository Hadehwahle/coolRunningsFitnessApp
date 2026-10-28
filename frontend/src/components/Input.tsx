import React, { useId } from 'react';
import { cn } from '@/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

// The label is linked to the input (htmlFor/id) so clicking it focuses the field
// and screen readers announce it. Errors are linked with aria-describedby.
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;
    const hintId = error || helperText ? `${inputId}-hint` : undefined;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-foreground mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">{icon}</div>}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={hintId}
            className={cn('input', icon && 'pl-11', error && 'border-danger/60 focus:ring-danger/20 focus:border-danger/60', className)}
            {...props}
          />
        </div>
        {error && <p id={hintId} className="mt-1.5 text-xs text-danger">{error}</p>}
        {helperText && !error && <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
