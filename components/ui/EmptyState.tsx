import { AlertCircle, type LucideIcon } from 'lucide-react';
import { ORG_URL } from '@/lib/constants';
import { cn } from '@/lib/cn';

/** Centered in-card empty state (§5.9). */
export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-10 text-center',
        className,
      )}
    >
      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-jade-50">
        <Icon aria-hidden="true" className="h-5 w-5 text-jade-600" strokeWidth={1.6} />
      </span>
      <p className="text-[14px] font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-[34ch] text-[12.5px] leading-[1.45] text-ink-3">
        {description}
      </p>
      <a
        href={ORG_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 text-[12.5px] font-medium text-jade-700 underline underline-offset-2 hover:text-jade-600"
      >
        View the organization on Hugging Face
      </a>
    </div>
  );
}

/**
 * Scoped section error (§5.9). Never replaces the page — the rest of the
 * dashboard keeps rendering. `onRetry` re-triggers revalidation.
 */
export function ErrorState({
  message,
  detail,
  onRetry,
  className,
}: {
  message: string;
  detail?: string;
  onRetry?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 rounded-[var(--radius-inner)] bg-surface-2 p-5',
        className,
      )}
    >
      <AlertCircle
        aria-hidden="true"
        className="mt-px h-[18px] w-[18px] shrink-0 text-danger"
        strokeWidth={1.8}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-medium text-ink">{message}</p>
        {detail ? (
          <p className="mt-1 text-[12px] leading-[1.45] text-ink-3">{detail}</p>
        ) : null}
        {onRetry ? <div className="mt-3">{onRetry}</div> : null}
      </div>
    </div>
  );
}
