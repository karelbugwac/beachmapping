'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { WaveThemeTransition } from '@/components/ui/wave-theme-transition';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isTransitioning?: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState<Theme | null>(null);
  const transitionTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Apply theme directly to DOM
  const applyThemeToDOM = (nextTheme: Theme) => {
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('dtb_theme') as Theme | null;
    const initialTheme =
      savedTheme === 'dark' || savedTheme === 'light'
        ? savedTheme
        : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

    setThemeState(initialTheme);
    applyThemeToDOM(initialTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('dtb_theme')) {
        const autoTheme: Theme = e.matches ? 'dark' : 'light';
        setThemeState(autoTheme);
        applyThemeToDOM(autoTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      transitionTimeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const setTheme = (newTheme: Theme) => {
    if (newTheme === theme) return;
    if (isTransitioning) return; // Prevent rapid re-triggering during wave

    // If user prefers reduced motion, skip wave animation
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !mounted) {
      setThemeState(newTheme);
      localStorage.setItem('dtb_theme', newTheme);
      applyThemeToDOM(newTheme);
      return;
    }

    // Clear any previous transition timers
    transitionTimeoutsRef.current.forEach(clearTimeout);
    transitionTimeoutsRef.current = [];

    // Trigger wave transition
    setIsTransitioning(true);
    setTransitionTarget(newTheme);

    // Swap theme at peak wave coverage (380ms)
    const swapTimer = setTimeout(() => {
      setThemeState(newTheme);
      localStorage.setItem('dtb_theme', newTheme);
      applyThemeToDOM(newTheme);
    }, 380);

    // Complete wave transition and unmount overlay (900ms)
    const endTimer = setTimeout(() => {
      setIsTransitioning(false);
      setTransitionTarget(null);
    }, 900);

    transitionTimeoutsRef.current = [swapTimer, endTimer];
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isTransitioning }}>
      {children}
      <WaveThemeTransition active={isTransitioning} targetTheme={transitionTarget} />
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'light' as Theme,
      toggleTheme: () => {},
      setTheme: () => {},
      isTransitioning: false,
    };
  }
  return context;
}
