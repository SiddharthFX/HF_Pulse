import { cn } from '@/lib/cn';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold ' +
  'transition-[background-color,border-color,color,transform,box-shadow] duration-200 ' +
  'active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45';

const variants = {
  ink: 'border border-jade-100 bg-jade-50 text-jade-900 hover:border-jade-200 hover:bg-jade-100',
  jade: 'bg-action text-on-action shadow-[0_8px_18px_-10px_rgba(18,173,118,.65)] hover:bg-action-hover hover:shadow-[0_10px_22px_-10px_rgba(18,173,118,.7)]',
  outline: 'border border-border bg-surface text-ink shadow-[0_1px_2px_rgba(16,23,19,.05)] hover:border-border-2 hover:bg-surface-2',
  surface: 'bg-surface-2 text-ink hover:bg-surface-3',
} as const;

const sizes = {
  sm: 'h-10 rounded-[var(--radius-pill)] px-3.5 text-[13px] sm:h-7 sm:px-3 sm:text-[12px]',
  md: 'h-10 rounded-[var(--radius-pill)] px-4 text-[13.5px]',
  action: 'h-11 rounded-[var(--radius-inner)] px-4 text-[13.5px]',
} as const;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({
  className,
  variant = 'outline',
  size = 'action',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

type LinkButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function LinkButton({
  className,
  variant = 'outline',
  size = 'action',
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <a
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </a>
  );
}
