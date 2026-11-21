'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme, isTransitioning } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={isTransitioning}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CF4530] text-[var(--color-sidebar-muted)] hover:text-[var(--color-sidebar-text)] hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
      aria-label={isDark ? 'Switch to light theme (sun-bleached sand)' : 'Switch to dark theme (night tide)'}
      title={isDark ? 'Switch to light theme' : 'Switch to night tide theme'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-brand-sun-700" strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4 text-[var(--color-seafoam-200)]" strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  );
}
