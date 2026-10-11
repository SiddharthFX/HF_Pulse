'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { RepoView } from '@/types/hf';

interface ShellContextValue {
  /** Every repo, for the topbar search index. */
  repos: RepoView[];
  /** The single dialog surface every click target routes through (§8). */
  dialogRepo: RepoView | null;
  openRepo: (repo: RepoView, trigger?: HTMLElement | null) => void;
  closeRepo: () => void;
  activeSection: string;
  setActiveSection: (id: string) => void;
  /** Set by the sidebar "Tasks" item — groups the models grid by task. */
  groupModelsByTask: boolean;
  setGroupModelsByTask: (on: boolean) => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('useShell must be used inside <ShellProvider>');
  return ctx;
}

export function ShellProvider({
  repos,
  children,
}: {
  repos: RepoView[];
  children: React.ReactNode;
}) {
  const [dialogRepo, setDialogRepo] = useState<RepoView | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [groupModelsByTask, setGroupModelsByTask] = useState(false);

  /** Element that had focus before the dialog opened, restored on close (§5.7). */
  const triggerRef = useRef<HTMLElement | null>(null);

  const openRepo = useCallback((repo: RepoView, trigger?: HTMLElement | null) => {
    triggerRef.current =
      trigger ??
      (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setDialogRepo(repo);
  }, []);

  const closeRepo = useCallback(() => {
    setDialogRepo(null);
    // Return focus to whatever opened the dialog.
    const trigger = triggerRef.current;
    if (trigger && document.contains(trigger)) {
      requestAnimationFrame(() => trigger.focus());
    }
    triggerRef.current = null;
  }, []);

  const value = useMemo(
    () => ({
      repos,
      dialogRepo,
      openRepo,
      closeRepo,
      activeSection,
      setActiveSection,
      groupModelsByTask,
      setGroupModelsByTask,
    }),
    [repos, dialogRepo, openRepo, closeRepo, activeSection, groupModelsByTask],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

/** Smooth-scrolls to a section, respecting reduced-motion. */
export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

/** Tracks which section is in view so the sidebar can reflect it. */
export function useSectionObserver(
  ids: readonly string[],
  rootRef?: React.RefObject<HTMLElement | null>,
): void {
  const { setActiveSection } = useShell();

  useEffect(() => {
    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Pick the earliest section currently in view for a stable result.
        const first = ids.find((id) => visible.has(id));
        if (first) setActiveSection(first);
      },
      {
        root: rootRef?.current ?? null,
        rootMargin: '-15% 0px -70% 0px',
        threshold: 0,
      },
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [ids, rootRef, setActiveSection]);
}

/** localStorage-backed state that degrades silently when storage is unavailable. */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(initial);

  // Read after mount so server and first client render agree (no hydration gap).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* storage disabled or value corrupt — keep the initial value */
    }
  }, [key]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* non-fatal */
      }
    },
    [key],
  );

  return [value, update];
}
