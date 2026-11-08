'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  FACILITY_CATEGORY_CONFIG,
  type FacilityCategory,
  getFacilityCategoryLabel,
} from '@/lib/utils/facility-categories';

interface FacilityCategorySelectProps {
  value: FacilityCategory | string;
  onChange: (value: FacilityCategory) => void;
}

const OPTIONS = Object.entries(FACILITY_CATEGORY_CONFIG)
  .filter(([, option]) => !('selectable' in option) || option.selectable !== false)
  .map(([value, option]) => ({ value: value as FacilityCategory, label: option.label }));

export function FacilityCategorySelect({ value, onChange }: FacilityCategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, OPTIONS.findIndex((option) => option.value === value))
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedIndex = OPTIONS.findIndex((option) => option.value === value);
  const selectedLabel = OPTIONS[selectedIndex]?.label ?? getFacilityCategoryLabel(value);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const chooseOption = (index: number) => {
    const option = OPTIONS[index];
    if (!option) return;
    onChange(option.value);
    setActiveIndex(index);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label="Facility category"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="facility-category-options"
        aria-activedescendant={isOpen ? `facility-category-option-${activeIndex}` : undefined}
        onClick={() => {
          setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
          setIsOpen((open) => !open);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
              setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
            } else {
              setActiveIndex((index) => (index + 1) % OPTIONS.length);
            }
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
              setActiveIndex(selectedIndex >= 0 ? selectedIndex : OPTIONS.length - 1);
            } else {
              setActiveIndex((index) => (index - 1 + OPTIONS.length) % OPTIONS.length);
            }
          } else if (event.key === 'Home') {
            event.preventDefault();
            setActiveIndex(0);
          } else if (event.key === 'End') {
            event.preventDefault();
            setActiveIndex(OPTIONS.length - 1);
          } else if (event.key === 'Enter' && isOpen) {
            event.preventDefault();
            chooseOption(activeIndex);
          } else if (event.key === ' ' && isOpen) {
            event.preventDefault();
            chooseOption(activeIndex);
          }
        }}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-800 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:hover:border-emerald-700 dark:hover:bg-neutral-900"
      >
        <span className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 dark:bg-neutral-800 dark:text-neutral-100">
          <span className="truncate">{selectedLabel}</span>
        </span>
        <ChevronDown className={`ml-3 h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div
          id="facility-category-options"
          role="listbox"
          aria-label="Facility categories"
          className="absolute left-0 right-0 z-30 mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/30"
        >
          {OPTIONS.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <button
                key={option.value}
                id={`facility-category-option-${index}`}
                type="button"
                tabIndex={-1}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => chooseOption(index)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  isSelected
                    ? 'bg-slate-100 font-semibold text-slate-800 dark:bg-neutral-800 dark:text-neutral-100'
                    : isActive
                      ? 'bg-slate-100 text-slate-900 dark:bg-neutral-800 dark:text-white'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                }`}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="ml-3 h-4 w-4 shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
