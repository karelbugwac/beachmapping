'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/themeprovider';

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
      <div className={`w-full flex items-center justify-between py-1 ${className}`}>
        <span className="font-display text-xs font-medium uppercase tracking-[0.16em] text-slate-600 dark:text-neutral-300">
          {isDark ? 'Night Mode' : 'Day Mode'}
        </span>

        {/* Modern pill toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={toggleTheme}
          disabled={isTransitioning}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-all duration-300 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
            isDark
              ? 'bg-gradient-to-r from-[#16305a] to-[#1F3F74] shadow-md shadow-[#1F3F74]/30'
              : 'bg-slate-200 dark:bg-neutral-700'
          }`}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span
            className={`pointer-events-none inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5 transition duration-300 ease-in-out ${
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
