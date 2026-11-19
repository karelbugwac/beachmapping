'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

interface ThemeToggleProps {
  className?: string;
  variant?: 'pill' | 'icon' | 'drawer';
  isTransparent?: boolean;
}

export function ThemeToggle({ className = '', variant = 'pill', isTransparent = false }: ThemeToggleProps) {
  const { theme, toggleTheme, isTransitioning, mounted } = useTheme();
  const isDark = mounted && theme === 'dark';

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        disabled={isTransitioning}
        className={`relative p-2 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isTransparent
            ? 'text-white hover:bg-white/20'
            : 'text-slate-600 dark:text-slate-300 hover:text-[#1F3F74] dark:hover:text-[#4987BA] hover:bg-slate-100 dark:hover:bg-neutral-800'
        } ${className}`}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <Sun className="h-[18px] w-[18px] text-amber-300" />
        ) : (
          <Moon className={`h-[18px] w-[18px] ${isTransparent ? 'text-white' : 'text-[#1F3F74]'}`} />
        )}
      </button>
    );
  }

  if (variant === 'drawer') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        disabled={isTransitioning}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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

  // Default 'pill' variant: fits beside the Sign Up button
  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={isTransitioning}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        isTransparent
          ? 'bg-white/15 hover:bg-white/25 border-white/30 text-white backdrop-blur-xs shadow-none'
          : isDark
            ? 'bg-neutral-900 border-neutral-700 text-amber-300 hover:bg-neutral-800 hover:border-neutral-600 shadow-xs'
            : 'bg-slate-100 border-slate-200 text-[#1F3F74] hover:bg-slate-200 hover:border-slate-300 shadow-xs'
      } ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-300" />
          <span>Light</span>
        </>
      ) : (
        <>
          <Moon className={`w-3.5 h-3.5 ${isTransparent ? 'text-white' : 'text-[#1F3F74]'}`} />
          <span>Dark</span>
        </>
      )}
    </button>
  );
}
