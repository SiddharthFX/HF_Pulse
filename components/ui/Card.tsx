import { cn } from '@/lib/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  index?: number;
  as?: 'div' | 'section' | 'article';
}

export function Card({
  className,
  index = 0,
  as: Tag = 'div',
  style,
  children,
  ...rest
}: CardProps) {
  const delay = Math.min(index, 8) * 50;
  return (
    <Tag
      className={cn(
        'relative rounded-[var(--radius-card)] border border-border/70 bg-surface',
        'shadow-[0_1px_2px_rgba(26,31,27,.03),0_12px_32px_-28px_rgba(26,31,27,.28)]',
        'dark:border-border dark:shadow-[0_1px_0_rgba(255,255,255,.02)_inset,0_18px_40px_-30px_rgba(0,0,0,.8)]',
        'transition-[box-shadow,border-color,transform] duration-300 ease-[var(--ease-ui)]',
        'hover:shadow-[0_1px_2px_rgba(26,31,27,.04),0_22px_44px_-30px_rgba(40,64,48,.38)]',
        'animate-[card-in_420ms_cubic-bezier(.2,.8,.2,1)_both]',
        className,
      )}
      style={{ animationDelay: `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  /** Optional leading icon chip, as in the reference's "Engagement Rate" header. */
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-ink-2">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="truncate text-[16px] font-semibold tracking-[-0.01em] text-ink">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[12px] leading-4 text-ink-3">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
