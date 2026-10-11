'use client';

import Image from 'next/image';
import {
  Activity,
  BookOpen,
  Box,
  ChevronsLeft,
  Compass,
  Database,
  ExternalLink,
  Grid2X2,
  LayoutList,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { LS_KEYS, ORG_DISPLAY_NAME, ORG_URL } from '@/lib/constants';
import {
  scrollToSection,
  useShell,
  usePersistentState,
} from '@/components/shell/ShellContext';

interface NavItem {
  id: string;
  label: string;
  icon: typeof Grid2X2;
  target: string;
  count?: number;
}

export function Sidebar({
  datasetCount,
  collapsed,
  onCollapsedChange,
  variant = 'fixed',
  onNavigate,
}: {
  datasetCount: number;
  collapsed: boolean;
  onCollapsedChange: (next: boolean) => void;
  variant?: 'fixed' | 'drawer';
  onNavigate?: () => void;
}) {
  const { activeSection, setActiveSection, groupModelsByTask, setGroupModelsByTask } = useShell();
  const [promoDismissed, setPromoDismissed] = usePersistentState<boolean>(
    LS_KEYS.promoDismissed,
    false,
  );

  const isCollapsed = variant === 'drawer' ? false : collapsed;

  const primaryNav: readonly NavItem[] = [
    { id: 'overview', label: 'Overview', icon: Grid2X2, target: 'overview' },
    { id: 'models', label: 'Models', icon: Box, target: 'models' },
    { id: 'datasets', label: 'Datasets', icon: Database, target: 'datasets', count: datasetCount },
    { id: 'activity', label: 'Activity', icon: Activity, target: 'activity' },
  ];

  function go(item: NavItem) {
    setActiveSection(item.id);
    scrollToSection(item.target);
    onNavigate?.();
  }

  return (
    <aside
      aria-label="Dashboard sections"
      className={cn(
        'flex h-full shrink-0 flex-col overflow-hidden border-r border-border/80 bg-surface',
        'shadow-[16px_0_45px_-38px_rgba(19,32,25,.65)]',
        'transition-[width] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]',
        isCollapsed ? 'w-[80px]' : 'w-[260px]',
      )}
    >
      <div className={cn('flex h-[76px] shrink-0 items-center', isCollapsed ? 'justify-center px-3' : 'px-6')}>
        {isCollapsed ? (
          <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-[13px] border border-border bg-white shadow-[0_6px_18px_-12px_rgba(19,32,25,.55)] dark:bg-surface-2">
            <Image src="/pluto-logo.webp" alt="" width={40} height={40} className="h-9 w-9 object-contain dark:hidden" priority />
            <Image src="/pluto-logo-dark.webp" alt="" width={40} height={40} className="hidden h-9 w-9 object-contain dark:block" priority />
          </span>
        ) : (
          <span className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-[13px] border border-border bg-white shadow-[0_8px_22px_-16px_rgba(19,32,25,.7)] dark:bg-surface-2">
              <Image src="/pluto-logo.webp" alt="" width={40} height={40} className="h-9 w-9 object-contain dark:hidden" priority />
              <Image src="/pluto-logo-dark.webp" alt="" width={40} height={40} className="hidden h-9 w-9 object-contain dark:block" priority />
            </span>
            <span>
              <span className="block text-[15px] font-bold leading-none tracking-[-0.01em] text-ink">
                {ORG_DISPLAY_NAME}
              </span>
              <span className="mt-1.5 block text-[9px] font-semibold uppercase tracking-[0.17em] text-ink-3">
                Hub Analytics
              </span>
            </span>
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none">
        {!isCollapsed ? (
          <p className="mb-2 px-7 text-[9.5px] font-bold uppercase tracking-[0.18em] text-ink-3/70">
            Workspace
          </p>
        ) : null}
        <ul className={cn('space-y-1', isCollapsed ? 'px-3' : 'px-4')}>
          {primaryNav.map((item) => (
            <NavRow
              key={item.id}
              item={item}
              active={activeSection === item.id || (item.id === 'datasets' && activeSection.startsWith('datasets'))}
              collapsed={isCollapsed}
              onClick={() => go(item)}
            />
          ))}
        </ul>

        <div className={cn('my-5 h-px bg-border', isCollapsed ? 'mx-4' : 'mx-7')} />

        {!isCollapsed ? (
          <p className="mb-2 px-7 text-[9.5px] font-bold uppercase tracking-[0.18em] text-ink-3/70">
            Explore
          </p>
        ) : null}
        <ul className={cn('space-y-1', isCollapsed ? 'px-3' : 'px-4')}>
          <li>
            <button
              type="button"
              onClick={() => {
                setGroupModelsByTask(!groupModelsByTask);
                scrollToSection('models');
                onNavigate?.();
              }}
              aria-pressed={groupModelsByTask}
              title={isCollapsed ? 'Group models by task' : undefined}
              className={cn(
                'group relative flex h-11 w-full items-center rounded-[13px] text-[13.5px] font-medium',
                'transition-colors duration-200',
                isCollapsed ? 'justify-center px-0' : 'gap-3 px-3.5',
                groupModelsByTask
                  ? 'bg-jade-50 text-jade-900'
                  : 'text-ink-2 hover:bg-jade-50/60 hover:text-ink',
              )}
            >
              <LayoutList
                aria-hidden="true"
                className={cn(
                  'h-[17px] w-[17px] shrink-0',
                  groupModelsByTask ? 'text-jade-600' : 'text-ink-3',
                )}
                strokeWidth={1.7}
              />
              {!isCollapsed && <span className="truncate">Group by task</span>}
            </button>
          </li>
          <ExternalRow
            href="https://huggingface.co/docs/hub/model-cards"
            label="Model cards"
            icon={BookOpen}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />
          <ExternalRow
            href="https://huggingface.co/docs/hub/index"
            label="Hub docs"
            icon={ExternalLink}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        </ul>
      </nav>

      {!isCollapsed && !promoDismissed ? (
        <div className="relative mx-4 mb-4 overflow-hidden rounded-[18px] border border-jade-100 bg-[linear-gradient(145deg,var(--color-surface)_0%,var(--color-jade-50)_100%)] p-5 shadow-[0_14px_32px_-26px_rgba(10,139,96,.65)]">
          <div className="pointer-events-none absolute -right-7 -top-8 h-24 w-24 rounded-full bg-jade-200/35 blur-2xl" />
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setPromoDismissed(true)}
            className="absolute right-3 top-3 rounded-full p-1 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-jade-100 bg-surface text-jade-600 shadow-sm">
            <Compass aria-hidden="true" className="h-[17px] w-[17px]" strokeWidth={1.7} />
          </span>
          <p className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Public research hub
          </p>
          <p className="mt-1.5 text-[12px] leading-[1.5] text-ink-2">
            Explore every {ORG_DISPLAY_NAME} model and dataset, refreshed every 12 hours.
          </p>
          <a
            href={ORG_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onNavigate}
            className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-[11px] bg-action text-[12.5px] font-bold text-on-action shadow-[0_8px_18px_-12px_rgba(18,173,118,.85)] transition-[background-color,transform] hover:bg-action-hover active:scale-[.98]"
          >
            Open organization
            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
          </a>
        </div>
      ) : null}

      {variant === 'fixed' ? (
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex h-14 w-full shrink-0 items-center gap-2 border-t border-border',
            'text-[12.5px] text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink-2',
            collapsed ? 'justify-center px-0' : 'px-6',
          )}
        >
          <ChevronsLeft
            aria-hidden="true"
            className={cn(
              'h-4 w-4 shrink-0 transition-transform duration-300',
              collapsed && 'rotate-180',
            )}
            strokeWidth={1.8}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      ) : null}
    </aside>
  );
}

function ActiveBar() {
  return (
    <span
      aria-hidden="true"
      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-jade-500"
    />
  );
}

function NavRow({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'true' : undefined}
        title={collapsed ? item.label : undefined}
        className={cn(
          'group relative flex h-11 w-full items-center rounded-[13px] text-[13.5px] font-medium',
          'transition-[background-color,color,transform] duration-200 active:scale-[.99]',
          collapsed ? 'justify-center px-0' : 'justify-between px-3.5',
          active
            ? 'bg-jade-50 text-jade-900 shadow-[inset_0_0_0_1px_rgba(18,173,118,.08)]'
            : 'text-ink-2 hover:bg-jade-50/60 hover:text-ink',
        )}
      >
        {active ? <ActiveBar /> : null}
        <span className={cn('flex items-center', collapsed ? 'justify-center' : 'min-w-0 gap-3')}>
          <Icon
            aria-hidden="true"
            className={cn(
              'h-[17px] w-[17px] shrink-0 transition-colors',
              active ? 'text-jade-600' : 'text-ink-3 group-hover:text-ink-2',
            )}
            strokeWidth={1.7}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </span>
        {!collapsed && item.count !== undefined ? (
          <span className="num inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-jade-100 bg-jade-50 px-1.5 text-[10.5px] font-semibold leading-none text-jade-700">
            {item.count}
          </span>
        ) : null}
      </button>
    </li>
  );
}

function ExternalRow({
  href,
  label,
  icon: Icon,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof BookOpen;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        title={collapsed ? label : undefined}
        className={cn(
          'group flex h-11 w-full items-center rounded-[13px] text-[13.5px] font-medium',
          'text-ink-2 transition-colors duration-200 hover:bg-jade-50/60 hover:text-ink',
          collapsed ? 'justify-center px-0' : 'gap-3 px-3.5',
        )}
      >
        <Icon
          aria-hidden="true"
          className="h-[17px] w-[17px] shrink-0 text-ink-3 transition-colors group-hover:text-ink-2"
          strokeWidth={1.7}
        />
        {!collapsed && <span className="truncate">{label}</span>}
      </a>
    </li>
  );
}
