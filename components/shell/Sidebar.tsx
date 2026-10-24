'use client';

import Image from 'next/image';
import {
  Activity,
  BookOpen,
  Box,
  Database,
  ExternalLink,
  Grid2X2,
  LayoutList,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { ORG_DISPLAY_NAME, ORG_URL } from '@/lib/constants';
import { scrollToSection, useShell } from '@/components/shell/ShellContext';

interface NavItem {
  id: string;
  label: string;
  icon: typeof Grid2X2;
  target: string;
  count?: number;
}

export function buildPrimaryNav(datasetCount: number): readonly NavItem[] {
  return [
    { id: 'overview', label: 'Overview', icon: Grid2X2, target: 'overview' },
    { id: 'models', label: 'Models', icon: Box, target: 'models' },
    { id: 'datasets', label: 'Datasets', icon: Database, target: 'datasets', count: datasetCount },
    { id: 'activity', label: 'Activity', icon: Activity, target: 'activity' },
  ];
}

export function isNavActive(activeSection: string, id: string): boolean {
  return activeSection === id || (id === 'datasets' && activeSection.startsWith('datasets'));
}

const EXTERNAL_LINKS = [
  { href: 'https://huggingface.co/docs/hub/model-cards', label: 'Model cards', icon: BookOpen },
  { href: 'https://huggingface.co/docs/hub/index', label: 'Hub docs', icon: ExternalLink },
] as const;

/**
 * Two presentations of the same navigation:
 *  - `rail`   — the floating icon-only pill rail from the reference (md and up)
 *  - `drawer` — the full labelled panel used by the mobile drawer
 */
export function Sidebar({
  datasetCount,
  variant = 'rail',
  onNavigate,
}: {
  datasetCount: number;
  variant?: 'rail' | 'drawer';
  onNavigate?: () => void;
}) {
  const { activeSection, setActiveSection, groupModelsByTask, setGroupModelsByTask } = useShell();
  const primaryNav = buildPrimaryNav(datasetCount);

  function go(item: NavItem) {
    setActiveSection(item.id);
    scrollToSection(item.target);
    onNavigate?.();
  }

  function toggleGrouping() {
    setGroupModelsByTask(!groupModelsByTask);
    scrollToSection('models');
    onNavigate?.();
  }

  if (variant === 'drawer') {
    return (
      <DrawerPanel
        primaryNav={primaryNav}
        activeSection={activeSection}
        groupModelsByTask={groupModelsByTask}
        onGo={go}
        onToggleGrouping={toggleGrouping}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <aside aria-label="Dashboard sections" className="flex h-full flex-col items-center gap-3">
      <RailGroup>
        {primaryNav.map((item) => {
          const active = isNavActive(activeSection, item.id);
          const Icon = item.icon;
          return (
            <RailButton
              key={item.id}
              label={item.count !== undefined ? `${item.label} (${item.count})` : item.label}
              tooltip={item.label}
              active={active}
              aria-current={active ? 'true' : undefined}
              onClick={() => go(item)}
            >
              <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />
              {item.count !== undefined && item.count > 0 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'num absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1',
                    'border-2 border-surface bg-clay text-[9.5px] font-bold leading-none text-white',
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </RailButton>
          );
        })}
      </RailGroup>

      <RailGroup>
        <RailButton
          label="Group models by task"
          tooltip={groupModelsByTask ? 'Ungroup models' : 'Group by task'}
          active={groupModelsByTask}
          aria-pressed={groupModelsByTask}
          onClick={toggleGrouping}
        >
          <LayoutList aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </RailButton>
        {EXTERNAL_LINKS.map(({ href, label, icon: Icon }) => (
          <RailLink key={href} href={href} label={label}>
            <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </RailLink>
        ))}
      </RailGroup>

      <RailGroup className="mt-auto">
        <RailLink href={ORG_URL} label={`Open ${ORG_DISPLAY_NAME} on Hugging Face`} tooltip="Open organization">
          <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-border dark:bg-surface-2">
            <Image src="/pluto-logo.webp" alt="" width={36} height={36} className="h-8 w-8 object-contain dark:hidden" />
            <Image src="/pluto-logo-dark.webp" alt="" width={36} height={36} className="hidden h-8 w-8 object-contain dark:block" />
          </span>
        </RailLink>
      </RailGroup>
    </aside>
  );
}

function RailGroup({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-full border border-border/70 bg-surface p-2',
        'shadow-[0_1px_2px_rgba(26,31,27,.03),0_12px_30px_-24px_rgba(26,31,27,.35)]',
        'dark:border-border',
        className,
      )}
    >
      {children}
    </div>
  );
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute left-[calc(100%+14px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap',
        'rounded-full bg-ink px-3 py-1.5 text-[12px] font-medium text-surface shadow-lg',
        'group-hover:block group-hover:animate-[tip-in_160ms_ease-out_both] group-focus-visible:block',
      )}
    >
      {children}
    </span>
  );
}

const railItemClass = (active: boolean) =>
  cn(
    'group relative inline-flex h-11 w-11 items-center justify-center rounded-full',
    'transition-[background-color,color,box-shadow,transform] duration-200 ease-[var(--ease-ui)] active:scale-95',
    active
      ? 'bg-action text-on-action shadow-[0_10px_20px_-10px_color-mix(in_srgb,var(--color-action)_90%,transparent)]'
      : 'text-ink-3 hover:bg-surface-2 hover:text-ink',
  );

function RailButton({
  label,
  tooltip,
  active,
  children,
  ...rest
}: {
  label: string;
  tooltip: string;
  active: boolean;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <button type="button" aria-label={label} className={railItemClass(active)} {...rest}>
      {children}
      <Tooltip>{tooltip}</Tooltip>
    </button>
  );
}

function RailLink({
  href,
  label,
  tooltip,
  children,
}: {
  href: string;
  label: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={railItemClass(false)}
    >
      {children}
      <Tooltip>{tooltip ?? label}</Tooltip>
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile drawer                                                       */
/* ------------------------------------------------------------------ */

function DrawerPanel({
  primaryNav,
  activeSection,
  groupModelsByTask,
  onGo,
  onToggleGrouping,
  onNavigate,
}: {
  primaryNav: readonly NavItem[];
  activeSection: string;
  groupModelsByTask: boolean;
  onGo: (item: NavItem) => void;
  onToggleGrouping: () => void;
  onNavigate?: () => void;
}) {
  return (
    <aside
      aria-label="Dashboard sections"
      className="flex h-full w-full flex-col overflow-hidden rounded-r-[28px] border-r border-border bg-surface shadow-[24px_0_60px_-30px_rgba(0,0,0,.45)]"
    >
      <div className="flex h-[76px] shrink-0 items-center gap-3 px-5">
        <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-border dark:bg-surface-2">
          <Image src="/pluto-logo.webp" alt="" width={44} height={44} className="h-10 w-10 object-contain dark:hidden" priority />
          <Image src="/pluto-logo-dark.webp" alt="" width={44} height={44} className="hidden h-10 w-10 object-contain dark:block" priority />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-[17px] font-semibold leading-none tracking-[-0.01em] text-ink">
            {ORG_DISPLAY_NAME}
          </span>
          <span className="mt-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            Hub Analytics
          </span>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 scrollbar-none">
        <p className="mb-2 mt-2 px-3 text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-3/80">
          Workspace
        </p>
        <ul className="space-y-1">
          {primaryNav.map((item) => {
            const active = isNavActive(activeSection, item.id);
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onGo(item)}
                  aria-current={active ? 'true' : undefined}
                  className={cn(drawerRowClass, active ? drawerActive : drawerIdle, 'justify-between')}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.count !== undefined ? (
                    <span
                      className={cn(
                        'num inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10.5px] font-semibold leading-none',
                        active ? 'bg-white/20 text-on-action' : 'bg-surface-2 text-ink-2',
                      )}
                    >
                      {item.count}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mx-3 my-5 h-px bg-border" />

        <p className="mb-2 px-3 text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-3/80">
          Explore
        </p>
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={onToggleGrouping}
              aria-pressed={groupModelsByTask}
              className={cn(drawerRowClass, 'gap-3', groupModelsByTask ? 'bg-jade-50 text-jade-900' : drawerIdle)}
            >
              <LayoutList aria-hidden="true" className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
              <span className="truncate">Group by task</span>
            </button>
          </li>
          {EXTERNAL_LINKS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onNavigate}
                className={cn(drawerRowClass, 'gap-3', drawerIdle)}
              >
                <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                <span className="truncate">{label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 p-4">
        <a
          href={ORG_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-action text-[13px] font-semibold text-on-action shadow-[0_10px_22px_-12px_color-mix(in_srgb,var(--color-action)_90%,transparent)] transition-[background-color,transform] hover:bg-action-hover active:scale-[.98]"
        >
          Open organization
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
        </a>
      </div>
    </aside>
  );
}

const drawerRowClass =
  'flex h-12 w-full items-center rounded-full px-4 text-[14px] font-medium transition-[background-color,color] duration-200';
const drawerActive =
  'bg-action text-on-action shadow-[0_10px_20px_-12px_color-mix(in_srgb,var(--color-action)_90%,transparent)]';
const drawerIdle = 'text-ink-2 hover:bg-surface-2 hover:text-ink';
