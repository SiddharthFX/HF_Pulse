'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Check,
  Clock3,
  Download,
  Menu,
  Moon,
  RefreshCw,
  Search,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  LS_KEYS,
  ORG,
  ORG_DISPLAY_NAME,
  ORG_URL,
  REFRESH_COOLDOWN_MS,
} from '@/lib/constants';
import { IconButton } from '@/components/ui/IconButton';
import { SearchField } from '@/components/shell/SearchField';
import { buildPrimaryNav, isNavActive } from '@/components/shell/Sidebar';
import {
  scrollToSection,
  usePersistentState,
  useShell,
} from '@/components/shell/ShellContext';
import type { DashboardPayload } from '@/types/hf';

type Toast = {
  message: string;
  tone: 'success' | 'warning' | 'error';
};

type Theme = 'light' | 'dark';

function parseTheme(raw: string | null): Theme | null {
  if (raw === 'dark' || raw === 'light') return raw;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Theme;
    return parsed === 'dark' || parsed === 'light' ? parsed : null;
  } catch {
    return null;
  }
}

export function Topbar({
  payload,
  onOpenDrawer,
}: {
  payload: DashboardPayload;
  onOpenDrawer: (trigger?: HTMLElement | null) => void;
}) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [prefsRevision, setPrefsRevision] = useState(0);
  const lastRefresh = useRef(0);
  const refreshBaseline = useRef<string | null>(null);
  const mobileSearchTriggerRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const cooldownActive = cooldownRemaining > 0;

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!cooldownActive) return;
    const timer = window.setInterval(() => {
      setCooldownRemaining((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownActive]);

  useEffect(() => {
    if (!refreshing || refreshBaseline.current === null) return;
    if (payload.fetchedAt === refreshBaseline.current) return;
    refreshBaseline.current = null;
    setRefreshing(false);
    setToast({ message: 'Updated just now', tone: 'success' });
  }, [payload.fetchedAt, refreshing]);

  useEffect(() => {
    if (!refreshing) return;
    const timer = window.setTimeout(() => {
      refreshBaseline.current = null;
      setRefreshing(false);
      setToast({ message: 'Refresh is taking longer than expected', tone: 'warning' });
    }, 12_000);
    return () => window.clearTimeout(timer);
  }, [refreshing]);

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 639px)');
    const onChange = () => {
      if (!mobile.matches) setMobileSearchOpen(false);
    };
    const onOpenSearch = () => {
      if (mobile.matches) setMobileSearchOpen(true);
    };
    mobile.addEventListener('change', onChange);
    window.addEventListener('pluto:open-search', onOpenSearch);
    return () => {
      mobile.removeEventListener('change', onChange);
      window.removeEventListener('pluto:open-search', onOpenSearch);
    };
  }, []);

  const closeMobileSearch = useCallback(() => {
    setMobileSearchOpen(false);
    requestAnimationFrame(() => mobileSearchTriggerRef.current?.focus());
  }, []);

  const handlePrefsChange = useCallback(() => {
    setPrefsRevision((revision) => revision + 1);
  }, []);

  async function refresh() {
    const now = Date.now();
    const remaining = Math.max(0, REFRESH_COOLDOWN_MS - (now - lastRefresh.current));
    if (refreshing || remaining > 0) {
      setToast({ message: 'Refresh will be available in a moment', tone: 'warning' });
      return;
    }
    lastRefresh.current = now;
    refreshBaseline.current = payload.fetchedAt;
    setCooldownRemaining(Math.ceil(REFRESH_COOLDOWN_MS / 1000));
    setRefreshing(true);
    try {
      const response = await fetch('/api/revalidate', { method: 'POST' });
      if (!response.ok) throw new Error(String(response.status));
      router.refresh();
    } catch {
      lastRefresh.current = 0;
      refreshBaseline.current = null;
      setRefreshing(false);
      setCooldownRemaining(0);
      setToast({ message: 'Refresh failed — try again shortly', tone: 'error' });
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${ORG}-hub-stats.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setToast({ message: 'JSON export downloaded', tone: 'success' });
  }

  const refreshDisabled = refreshing || cooldownActive;
  const refreshLabel = refreshing
    ? 'Refreshing Hugging Face data'
    : cooldownRemaining > 0
      ? `Refresh available in ${cooldownRemaining} seconds`
      : 'Refresh data from Hugging Face';

  return (
    <div
      className="relative flex h-16 items-center gap-2 px-2 sm:gap-3 sm:px-3"
      data-prefs-revision={prefsRevision}
    >
      <div
        className={cn(
          'w-full items-center gap-2 animate-[panel-in_160ms_ease-out_both] sm:hidden',
          mobileSearchOpen ? 'flex' : 'hidden',
        )}
      >
        <SearchField
          className="min-w-0 flex-1"
          autoFocus
          enableShortcut={false}
          returnFocusRef={mobileSearchTriggerRef}
          onClose={closeMobileSearch}
        />
        <IconButton aria-label="Close search" onClick={closeMobileSearch} variant="ghost">
          <X aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </IconButton>
      </div>

      <div
        className={cn(
          'min-w-0 flex-1 items-center gap-2 sm:gap-3',
          mobileSearchOpen ? 'hidden sm:flex' : 'flex',
        )}
      >
        <IconButton
          ref={menuButtonRef}
          aria-label="Open navigation"
          onClick={() => onOpenDrawer(menuButtonRef.current)}
          className="md:hidden"
        >
          <Menu aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.7} />
        </IconButton>

        <Brand />

        <NavTabs datasetCount={payload.datasets.length} />

        <SearchField className="hidden min-w-0 max-w-[420px] flex-1 sm:block xl:ml-auto xl:w-[260px] xl:flex-none 2xl:w-[300px]" />

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-2 xl:ml-0">
          <IconButton
            ref={mobileSearchTriggerRef}
            aria-label="Search repositories"
            onClick={() => setMobileSearchOpen(true)}
            className="sm:hidden"
          >
            <Search aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.7} />
          </IconButton>

          <IconButton
            aria-label={refreshLabel}
            aria-busy={refreshing}
            title={refreshLabel}
            onClick={refresh}
            disabled={refreshDisabled}
            className="max-[379px]:h-10 max-[379px]:w-10"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn('h-[18px] w-[18px]', refreshing && 'animate-[spin_900ms_linear_infinite]')}
              strokeWidth={1.7}
            />
          </IconButton>

          <SettingsPopover onPrefsChange={handlePrefsChange} />
          <ThemeToggle />

          <a
            href={ORG_URL}
            target="_blank"
            rel="noopener noreferrer"
            title={`View ${ORG_DISPLAY_NAME} on Hugging Face`}
            className="hidden h-11 items-center gap-2.5 rounded-[var(--radius-pill)] border border-border bg-surface py-1 pl-1 pr-4 transition-all duration-200 hover:border-jade-200 hover:bg-jade-50 2xl:flex"
          >
            <OrgAvatar />
            <span className="leading-tight">
              <span className="block text-[12.5px] font-semibold text-ink">{ORG_DISPLAY_NAME}</span>
              <span className="block text-[11px] text-ink-3">huggingface.co/{ORG}</span>
            </span>
          </a>

          <a
            href={ORG_URL}
            target="_blank"
            rel="noopener noreferrer"
            title={`View ${ORG_DISPLAY_NAME} on Hugging Face`}
            aria-label={`View ${ORG_DISPLAY_NAME} on Hugging Face`}
            className="hidden rounded-full transition-transform duration-200 hover:scale-105 lg:inline-flex 2xl:hidden"
          >
            <OrgAvatar />
          </a>

          <button
            type="button"
            onClick={exportJson}
            aria-label="Export dashboard data as JSON"
            className={cn(
              'inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-action px-0 sm:w-auto sm:px-5',
              'max-[379px]:h-10 max-[379px]:w-10',
              'text-[13px] font-semibold text-on-action shadow-[0_10px_22px_-12px_color-mix(in_srgb,var(--color-action)_90%,transparent)]',
              'transition-[background-color,transform,box-shadow] duration-200 hover:bg-action-hover active:scale-[.97]',
            )}
          >
            <Download aria-hidden="true" className="h-4 w-4" strokeWidth={1.9} />
            <span className="hidden sm:inline">Export JSON</span>
          </button>
        </div>
      </div>

      {toast ? (
        <div
          role={toast.tone === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={cn(
            'absolute right-2 top-[calc(100%+12px)] z-40 flex max-w-[calc(100%-1rem)] items-center gap-2 rounded-[var(--radius-pill)]',
            'border bg-surface/95 px-4 py-2.5 text-[12.5px] font-medium text-ink backdrop-blur-xl',
            'shadow-[0_18px_40px_-18px_rgba(16,23,19,.4)] animate-[card-in_220ms_cubic-bezier(.2,.8,.2,1)_both]',
            toast.tone === 'success' && 'border-jade-200',
            toast.tone === 'warning' && 'border-clay/40',
            toast.tone === 'error' && 'border-danger/35',
          )}
        >
          <span
            className={cn(
              'inline-flex h-5 w-5 items-center justify-center rounded-full',
              toast.tone === 'success' && 'bg-jade-50',
              toast.tone === 'warning' && 'bg-clay-50',
              toast.tone === 'error' && 'bg-danger/10',
            )}
          >
            {toast.tone === 'success' ? (
              <Check aria-hidden="true" className="h-3 w-3 text-jade-600" strokeWidth={2.4} />
            ) : toast.tone === 'warning' ? (
              <Clock3 aria-hidden="true" className="h-3 w-3 text-clay-700" strokeWidth={2.2} />
            ) : (
              <AlertCircle aria-hidden="true" className="h-3 w-3 text-danger" strokeWidth={2.2} />
            )}
          </span>
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}

function Brand() {
  return (
    <span className="flex min-w-0 shrink-0 items-center gap-2.5 max-[379px]:hidden md:pl-1">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-border dark:bg-surface-2">
        <Image src="/pluto-logo.webp" alt="" width={40} height={40} className="h-9 w-9 object-contain dark:hidden" priority />
        <Image src="/pluto-logo-dark.webp" alt="" width={40} height={40} className="hidden h-9 w-9 object-contain dark:block" priority />
      </span>
      <span className="hidden min-w-0 leading-none sm:block">
        <span className="block truncate font-display text-[17px] font-semibold tracking-[-0.015em] text-ink">
          {ORG_DISPLAY_NAME}
        </span>
        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3">
          Hub Analytics
        </span>
      </span>
    </span>
  );
}

/** Centered pill tabs (reference: Dashboard / Reports / …), mirroring the rail. */
function NavTabs({ datasetCount }: { datasetCount: number }) {
  const { activeSection, setActiveSection } = useShell();
  const items = buildPrimaryNav(datasetCount);

  return (
    <nav aria-label="Sections" className="mx-auto hidden xl:block">
      <ul className="flex items-center gap-1 rounded-full border border-border/70 bg-surface-2 p-1">
        {items.map((item) => {
          const active = isNavActive(activeSection, item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => {
                  setActiveSection(item.id);
                  scrollToSection(item.target);
                }}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-200',
                  active
                    ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(26,31,27,.06),0_6px_16px_-10px_rgba(26,31,27,.35)] dark:bg-surface-3'
                    : 'text-ink-3 hover:text-ink',
                )}
              >
                {item.label}
                {item.count !== undefined ? (
                  <span className="num rounded-full bg-jade-50 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-jade-700">
                    {item.count}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function OrgAvatar() {
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-border dark:bg-surface-2">
      <Image src="/pluto-logo.webp" alt="" width={36} height={36} className="h-8 w-8 object-contain dark:hidden" priority />
      <Image src="/pluto-logo-dark.webp" alt="" width={36} height={36} className="hidden h-8 w-8 object-contain dark:block" priority />
    </span>
  );
}
function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored: Theme | null = null;
    try {
      stored = parseTheme(window.localStorage.getItem(LS_KEYS.theme));
    } catch {
      stored = null;
    }
    const initial =
      stored ??
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initial);
    setReady(true);
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== LS_KEYS.theme) return;
      const next = parseTheme(event.newValue);
      if (next) setTheme(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    try {
      window.localStorage.setItem(LS_KEYS.theme, JSON.stringify(theme));
    } catch {}
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute('content', theme === 'dark' ? '#0d100e' : '#ebeae4');
    });
    window.dispatchEvent(new CustomEvent('pluto:theme', { detail: { theme } }));
  }, [ready, theme]);

  const label = !ready
    ? 'Toggle color theme'
    : theme === 'dark'
      ? 'Switch to light theme'
      : 'Switch to dark theme';

  return (
    <IconButton
      aria-label={label}
      aria-pressed={theme === 'dark'}
      title={label}
      onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
      variant="surface"
      className="overflow-hidden"
    >
      <span className="relative block h-[18px] w-[18px]">
        <Sun
          aria-hidden="true"
          className="absolute inset-0 h-[18px] w-[18px] scale-100 opacity-100 transition-[transform,opacity] duration-200 dark:scale-75 dark:opacity-0"
          strokeWidth={1.7}
        />
        <Moon
          aria-hidden="true"
          className="absolute inset-0 h-[18px] w-[18px] scale-75 opacity-0 transition-[transform,opacity] duration-200 dark:scale-100 dark:opacity-100"
          strokeWidth={1.7}
        />
      </span>
    </IconButton>
  );
}

function SettingsPopover({ onPrefsChange }: { onPrefsChange: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [logScale, setLogScale] = usePersistentState<boolean>(LS_KEYS.logScale, false);
  const [compact, setCompact] = usePersistentState<boolean>(LS_KEYS.compactNumbers, true);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      requestAnimationFrame(() => triggerRef.current?.focus());
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('pluto:prefs', { detail: { logScale, compact } }),
    );
    onPrefsChange();
  }, [compact, logScale, onPrefsChange]);

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        ref={triggerRef}
        aria-label="Display settings"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? 'display-settings' : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <Settings aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.7} />
      </IconButton>

      {open ? (
        <div
          id="display-settings"
          role="dialog"
          aria-label="Display settings"
          className={cn(
            'absolute left-1/2 top-[54px] z-40 w-[min(248px,calc(100vw-1rem))] -translate-x-1/2 rounded-[20px] animate-[panel-in_160ms_cubic-bezier(.2,.8,.2,1)_both]',
            'border border-border bg-surface/95 p-2 backdrop-blur-xl sm:right-0 sm:left-auto sm:translate-x-0',
            'shadow-[0_20px_50px_-18px_rgba(16,23,19,.35)]',
          )}
        >
          <ToggleRow
            label="Log scale charts"
            checked={logScale}
            onChange={() => setLogScale(!logScale)}
          />
          <ToggleRow
            label="Compact numbers"
            checked={compact}
            onChange={() => setCompact(!compact)}
          />
        </div>
      ) : null}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex w-full items-center justify-between gap-3 rounded-[14px] px-3 py-2.5 text-left text-[12.5px] font-medium text-ink-2 transition-colors hover:bg-surface-2"
    >
      {label}
      <span
        aria-hidden="true"
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-[160ms]',
          checked ? 'bg-action' : 'bg-border-2',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-[160ms]',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  );
}
