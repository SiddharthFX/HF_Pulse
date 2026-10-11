/**
 * Every formatter here is null-safe and renders an em dash rather than
 * NaN / undefined / a misleading 0 for missing data (§6).
 */

const EM_DASH = '—';

const compactFmt = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const fullFmt = new Intl.NumberFormat('en-US');

/**
 * Global compact preference. Toggled by the settings popover via `pluto:prefs`
 * custom event. When false, `formatCompact` delegates to `formatFull`.
 */
let useCompactNumbers = true;

if (typeof window !== 'undefined') {
  window.addEventListener('pluto:prefs', ((e: CustomEvent<{ compact?: boolean }>) => {
    if (e.detail && typeof e.detail.compact === 'boolean') {
      useCompactNumbers = e.detail.compact;
    }
  }) as EventListener);
}

const relFmt = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

const absFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function isNum(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

/** 1.24M, 842K, 9.1K. 0 → "0". null/undefined → "—". Respects compact preference. */
export function formatCompact(n: number | null | undefined): string {
  if (!isNum(n)) return EM_DASH;
  if (n === 0) return '0';
  if (!useCompactNumbers) return fullFmt.format(n);
  return compactFmt.format(n);
}

/** Grouped with commas: 1,243,880. Used in tooltips and the dialog. */
export function formatFull(n: number | null | undefined): string {
  if (!isNum(n)) return EM_DASH;
  return fullFmt.format(n);
}

/** Binary units, 1 decimal: 1.4 GB, 812 MB, 0 B. undefined → "—". */
export function formatBytes(b: number | null | undefined): string {
  if (!isNum(b)) return EM_DASH;
  if (b <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), units.length - 1);
  const value = b / 1024 ** i;
  const unit = units[i] ?? 'B';
  // Whole bytes read oddly with a decimal.
  const decimals = i === 0 ? 0 : 1;
  return `${value.toFixed(decimals)} ${unit}`;
}

/** 0.0512 → "5.1%". Pass a ratio, not a percentage. */
export function formatPct(
  ratio: number | null | undefined,
  digits = 1,
): string {
  if (!isNum(ratio)) return EM_DASH;
  return `${(ratio * 100).toFixed(digits)}%`;
}

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** today, 3 days ago, 2 weeks ago, 5 months ago. */
export function formatRelativeDate(
  iso: string | null | undefined,
  now: number = Date.now(),
): string {
  const d = parseDate(iso);
  if (!d) return EM_DASH;

  const diffMs = d.getTime() - now;
  const absSec = Math.abs(diffMs) / 1000;
  const sign = diffMs < 0 ? -1 : 1;

  const day = 86_400;
  if (absSec < 60) return 'just now';
  if (absSec < 3_600) return relFmt.format(sign * Math.round(absSec / 60), 'minute');
  if (absSec < day) return relFmt.format(sign * Math.round(absSec / 3_600), 'hour');

  const days = Math.round(absSec / day);
  if (days === 0) return 'today';
  if (days < 7) return relFmt.format(sign * days, 'day');
  if (days < 30) return relFmt.format(sign * Math.round(days / 7), 'week');
  if (days < 365) return relFmt.format(sign * Math.round(days / 30), 'month');
  return relFmt.format(sign * Math.round(days / 365), 'year');
}

/** 21 Feb 2026 */
export function formatAbsoluteDate(iso: string | null | undefined): string {
  const d = parseDate(iso);
  if (!d) return EM_DASH;
  return absFmt.format(d);
}

/** Whole days elapsed since an ISO timestamp. null when unparseable. */
export function daysSince(
  iso: string | null | undefined,
  now: number = Date.now(),
): number | null {
  const d = parseDate(iso);
  if (!d) return null;
  return Math.max(0, Math.floor((now - d.getTime()) / 86_400_000));
}

/** text-generation → Text Generation. token-classification → Token Classification. */
export function humanizeTask(slug: string | null | undefined): string {
  if (!slug) return EM_DASH;
  const cleaned = slug.replace(/^[a-z_]+:/i, '').replace(/[-_]+/g, ' ').trim();
  if (!cleaned) return EM_DASH;
  return cleaned
    .split(/\s+/)
    .map((w) => {
      // Keep known acronyms upper-cased.
      if (/^(ai|nlp|ml|llm|ocr|tts|asr|qa|api|3d|rl|cv)$/i.test(w)) {
        return w.toUpperCase();
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

/**
 * First two alphanumeric characters of the repo name, uppercased,
 * skipping the org prefix. "Pluto-AI-Labs/tiny-llm" → "TI".
 */
export function monogram(nameOrId: string | null | undefined): string {
  if (!nameOrId) return '??';
  const name = nameOrId.includes('/')
    ? (nameOrId.split('/').pop() ?? nameOrId)
    : nameOrId;
  const chars = name.replace(/[^a-z0-9]/gi, '');
  if (chars.length === 0) return '??';
  return chars.slice(0, 2).toUpperCase();
}

/** Truncate for chart axis ticks: 8 chars + ellipsis (§5.5). */
export function truncate(s: string, max = 8): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}
