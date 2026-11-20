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
      <button
        type="button"
        onClick={toggleTheme}
        disabled={isTransitioning}
        className={`w-full flex items-center justify-between px-3.5 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        <span className="flex items-center gap-2.5">
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-[#1F3F74]" />
          )}
          <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
        </span>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          {isDark ? 'Sunlit' : 'Night'}
        </span>
      </button>
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
          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800/80 active:bg-slate-200 dark:active:bg-neutral-700'
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
