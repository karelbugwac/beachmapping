'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

interface ThemeToggleProps {
  className?: string;
  variant?: 'minimal' | 'drawer';
  isTransparent?: boolean;
}

export function ThemeToggle({ className = '', variant = 'minimal', isTransparent = false }: ThemeToggleProps) {
  const { theme, toggleTheme, isTransitioning, mounted } = useTheme();
  const isDark = mounted && theme === 'dark';

  if (variant === 'drawer') {
    return (
      <div className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 transition-colors duration-200 ${className}`}>
        <span className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-white">
          {isDark ? (
            <Moon className="w-4 h-4 text-[#F4BF3E]" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
          <span>{isDark ? 'Night Mode' : 'Sunlit Mode'}</span>
        </span>

        {/* Modern iOS / Material style pill toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={toggleTheme}
          disabled={isTransitioning}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
            isDark ? 'bg-[#1F3F74]' : 'bg-slate-200'
          }`}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
              isDark ? 'translate-x-5' : 'translate-x-0'
            }`}
          >
            {isDark ? (
              <Moon className="w-3 h-3 text-[#1F3F74]" />
            ) : (
              <Sun className="w-3 h-3 text-amber-500" />
            )}
          </span>
        </button>
      </div>
    );
  }

  // Modern container-less icon toggle (no box/pill, touch-friendly 40x40px for mobile & desktop)
  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={isTransitioning}
      className={`group relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${
        isTransparent
          ? 'text-white hover:bg-white/15 active:bg-white/25'
          : 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-neutral-800/80 active:bg-white dark:active:bg-neutral-700'
      } ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="sr-only">{isDark ? 'Switch to light mode' : 'Switch to dark mode'}</span>
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-300 transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(252,211,77,0.4)]" />
      ) : (
        <Moon
          className={`w-5 h-5 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110 ${
            isTransparent
              ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]'
              : 'text-[#1F3F74] dark:text-[#4987BA]'
          }`}
        />
      )}
    </button>
  );
}
