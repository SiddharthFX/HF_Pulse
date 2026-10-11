'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ORG_URL } from '@/lib/constants';

/**
 * Last-resort boundary. Scoped failures are handled inside the sections
 * (§5.9); this only catches an unexpected render error.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-[440px] rounded-[var(--radius-card)] border border-border bg-surface p-7 text-center shadow-[0_1px_2px_rgba(16,20,18,.04)]">
        <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface-2">
          <AlertCircle aria-hidden="true" className="h-5 w-5 text-danger" strokeWidth={1.7} />
        </span>
        <h1 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">
          Something went wrong
        </h1>
        <p className="mt-2 text-[13px] leading-[1.5] text-ink-2">
          The dashboard could not be rendered. This is usually temporary — try
          again, or open the organization directly on the Hub.
        </p>
        {error.digest ? (
          <p className="num mt-3 text-[11px] text-ink-3">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-5 flex items-center justify-center gap-2.5">
          <Button variant="jade" onClick={reset}>
            Try again
          </Button>
          <a
            href={ORG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-medium text-ink-2 underline underline-offset-2 hover:text-ink"
          >
            Open on Hugging Face
          </a>
        </div>
      </div>
    </div>
  );
}
