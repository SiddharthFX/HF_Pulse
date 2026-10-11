import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required — these buttons are icon-only (§5.10). */
  'aria-label': string;
  size?: 28 | 32 | 44;
  variant?: 'bordered' | 'ghost' | 'surface';
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      className,
      size = 44,
      variant = 'bordered',
      type = 'button',
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-[var(--radius-inner)]',
        'text-ink-2 transition-[background-color,border-color,color,transform,box-shadow] duration-200',
        'active:scale-95 disabled:cursor-not-allowed disabled:opacity-45',
        variant === 'bordered' &&
          'border border-border bg-surface shadow-[0_1px_2px_rgba(16,23,19,.04)] hover:border-border-2 hover:bg-surface-2 hover:shadow-[0_6px_14px_-10px_rgba(16,23,19,.5)]',
        variant === 'surface' && 'bg-surface-2 hover:bg-surface-3',
        variant === 'ghost' && 'hover:bg-surface-2',
        size === 28 && 'h-7 w-7',
        size === 32 && 'h-8 w-8',
        size === 44 && 'h-11 w-11',
        className,
      )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
