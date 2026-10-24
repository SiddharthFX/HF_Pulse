import { cn } from '@/lib/cn';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold ' +
  'transition-[background-color,border-color,color,transform,box-shadow] duration-200 ' +
  'active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45';

const variants = {
  ink: 'border border-jade-100 bg-jade-50 text-jade-900 hover:border-jade-200 hover:bg-jade-100',
  jade: 'bg-action text-on-action shadow-[0_10px_22px_-12px_color-mix(in_srgb,var(--color-action)_90%,transparent)] hover:bg-action-hover hover:shadow-[0_14px_26px_-12px_color-mix(in_srgb,var(--color-action)_95%,transparent)]',
  outline: 'border border-border bg-surface text-ink hover:border-border-2 hover:bg-surface-2',
  surface: 'border border-border bg-surface-2 text-ink hover:bg-surface-3',
} as const;

const sizes = {
  sm: 'h-10 rounded-[var(--radius-pill)] px-3.5 text-[13px] sm:h-8 sm:px-3 sm:text-[12px]',
  md: 'h-10 rounded-[var(--radius-pill)] px-4 text-[13.5px]',
  action: 'h-11 rounded-[var(--radius-pill)] px-5 text-[13.5px]',
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
