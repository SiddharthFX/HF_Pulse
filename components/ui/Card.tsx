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
  const delay = Math.min(index, 8) * 45;
  return (
    <Tag
      className={cn(
        'relative rounded-[var(--radius-card)] border border-border/80 bg-surface',
        'shadow-[0_1px_2px_rgba(19,32,25,.035),0_16px_40px_-32px_rgba(19,32,25,.35)]',
        'transition-[box-shadow,border-color,transform] duration-300 ease-[var(--ease-ui)]',
        'hover:border-jade-300/80 dark:hover:border-jade-500/50 hover:shadow-[0_4px_24px_-10px_rgba(18,173,118,.22)]',
        'animate-[card-in_320ms_cubic-bezier(.2,.8,.2,1)_both]',
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
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h3 className="truncate text-[15px] font-semibold tracking-[-0.015em] text-ink">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-1 truncate text-[11.5px] leading-4 text-ink-3">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
