'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface RangeOption<T extends string> {
  value: T;
  label: string;
}

/**
 * The small pill dropdown used across card headers (7d ⌄, January ⌄, All ⌄).
 * A real listbox: arrow keys, Home/End, Enter/Space, Esc, click-outside.
 */
export function RangeSelect<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
  align = 'right',
}: {
  value: T;
  options: readonly RangeOption<T>[];
  onChange: (next: T) => void;
  /** Accessible name, e.g. "Time range". */
  label: string;
  className?: string;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setActiveIndex(idx === -1 ? 0 : idx);
    }
  }, [open, options, value]);

  function commit(index: number) {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      commit(activeIndex);
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-option-${activeIndex}` : undefined}
        aria-label={`${label}: ${selected?.label ?? ''}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
            setOpen(false);
          }
        }}
        className={cn(
          'inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-inner)] sm:h-8',
          'bg-surface-2 px-3.5 text-[13px] font-medium text-ink-2 sm:px-3 sm:text-[12px]',
          'transition-colors duration-[160ms] hover:bg-surface-3',
        )}
      >
        {selected?.label}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-[180ms]',
            open && 'rotate-180',
          )}
          strokeWidth={1.8}
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          className={cn(
            'absolute z-30 mt-1.5 min-w-[136px] overflow-hidden rounded-[var(--radius-inner)]',
            'border border-border bg-surface py-1',
            'shadow-[0_8px_24px_-8px_rgba(16,20,18,.16)]',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {options.map((option, i) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="none">
                <button
                  id={`${listId}-option-${i}`}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commit(i)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left',
                    'text-[12.5px] text-ink-2 transition-colors duration-[120ms]',
                    i === activeIndex && 'bg-surface-2',
                    isSelected && 'font-medium text-ink',
                  )}
                >
                  {option.label}
                  {isSelected ? (
                    <Check aria-hidden="true" className="h-3.5 w-3.5 text-jade-600" strokeWidth={2} />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
